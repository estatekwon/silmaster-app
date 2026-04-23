/**
 * POST /api/sync
 * 경기도 오픈API → Supabase 전체 동기화
 *
 * 보호: Authorization: Bearer {SYNC_SECRET}
 * GitHub Actions에서 매주 월요일 03:00 KST 호출
 */

export const runtime = "nodejs";
export const maxDuration = 300; // 5분 (Vercel Pro 기준)

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const GG_API_KEY = process.env.GG_API_KEY!;
const SYNC_SECRET = process.env.SYNC_SECRET!;
const PAGE_SIZE = 1000;

// ─── API 페치 헬퍼 ───────────────────────────────────────────────────────────

async function fetchPage(endpoint: string, page: number): Promise<Record<string, string>[]> {
  const url = new URL(`https://openapi.gg.go.kr/${endpoint}`);
  url.searchParams.set("KEY", GG_API_KEY);
  url.searchParams.set("Type", "json");
  url.searchParams.set("pIndex", String(page));
  url.searchParams.set("pSize", String(PAGE_SIZE));

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(30000) });
  const json = await res.json() as Record<string, unknown>;
  return (json?.[endpoint] as Array<{ row?: Record<string, string>[] }>)?.[1]?.row ?? [];
}

async function fetchAllPages(endpoint: string): Promise<Record<string, string>[]> {
  const all: Record<string, string>[] = [];
  let page = 1;

  while (true) {
    const rows = await fetchPage(endpoint, page);
    if (!rows.length) break;
    all.push(...rows);
    if (rows.length < PAGE_SIZE) break;
    page++;
    // 과부하 방지
    await new Promise((r) => setTimeout(r, 200));
  }

  return all;
}

// ─── 데이터 변환 ─────────────────────────────────────────────────────────────

function toFactoryRegister(r: Record<string, string>, idx: number) {
  const compny = r.COMPNY_GRP_NM ?? "";
  const administ = r.ADMINIST_INST_NM ?? "";
  const regist_de = r.FACTRY_REGIST_DE ?? "";
  const id = `fr_${administ}_${compny}_${regist_de}_${idx}`.replace(/\s+/g, "_").slice(0, 200);

  return {
    id,
    compny_grp_nm: compny,
    administ_inst_nm: administ,
    indutype_desc_dtcont: r.INDUTYPE_DESC_DTCONT ?? "",
    emply_cnt: r.EMPLY_CNT ?? "0",
    lot_ar: parseFloat(r.LOT_AR ?? "0") || 0,
    subfaclt_ar: parseFloat(r.SUBFACLT_AR ?? "0") || 0,
    factry_scale_div_nm: r.FACTRY_SCALE_DIV_NM ?? "",
    factry_regist_de: regist_de,
    refine_roadnm_addr: r.REFINE_ROADNM_ADDR ?? "",
    purpos_region_nm: r.PURPOS_REGION_NM ?? "",
    landcgr_nm: r.LANDCGR_NM ?? "",
    lat: parseFloat(r.REFINE_WGS84_LAT ?? "0") || 0,
    lng: parseFloat(r.REFINE_WGS84_LOGT ?? "0") || 0,
    synced_at: new Date().toISOString(),
  };
}

function toFactoryTransaction(r: Record<string, string>) {
  const recept_yy = r.RECEPT_YY ?? "";
  const recept_no = r.RECEPT_NO ?? "";
  const thing_seq = r.THING_SEQ_NO ?? "";
  const id = `ft_${recept_yy}_${recept_no}_${thing_seq}`;

  return {
    id,
    signgu_nm: r.SIGNGU_NM ?? "",
    emd_li_nm: r.EMD_LI_NM ?? "",
    contract_day: r.CONTRACT_DAY ?? "",
    prvtuse_ar: parseFloat(r.PRVTUSE_AR ?? "0") || 0,
    sitergt_ar: parseFloat(r.SITERGT_AR ?? "0") || 0,
    floor_cnt: r.FLOOR_CNT ?? "",
    delng_amt: parseInt(r.DELNG_AMT?.replace(/,/g, "") ?? "0") || 0,
    build_yy: r.BUILD_YY ?? "",
    buldng_wk_purpos_nm: r.BULDNG_WK_PURPOS_NM ?? "",
    rlse_yn: r.RLSE_YN ?? "N",
    mdt_div: r.MDT_DIV ?? "",
    purpos_region_nm: r.PURPOS_REGION_NM ?? "",
    synced_at: new Date().toISOString(),
  };
}

function toLandTransaction(r: Record<string, string>) {
  const recept_yy = r.RECEPT_YY ?? "";
  const recept_no = r.RECEPT_NO ?? "";
  const thing_seq = r.THING_SEQ_NO ?? "";
  const id = `lt_${recept_yy}_${recept_no}_${thing_seq}`;

  return {
    id,
    signgu_nm: r.SIGNGU_NM ?? "",
    emd_li_nm: r.EMD_LI_NM ?? "",
    contract_day: r.CONTRACT_DAY ?? "",
    land_delng_ar: parseFloat(r.LAND_DELNG_AR ?? "0") || 0,
    delng_amt: parseInt(r.DELNG_AMT?.replace(/,/g, "") ?? "0") || 0,
    purpos_region_nm: r.PURPOS_REGION_NM ?? "",
    landcgr_nm: r.LANDCGR_NM ?? "",
    rlse_yn: r.RLSE_YN ?? "N",
    synced_at: new Date().toISOString(),
  };
}

// ─── Supabase upsert (배치) ──────────────────────────────────────────────────

async function upsertBatch<T extends object>(table: string, rows: T[]): Promise<number> {
  const BATCH = 500;
  let upserted = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await supabaseAdmin
      .from(table)
      .upsert(chunk, { onConflict: "id", ignoreDuplicates: false });

    if (error) throw new Error(`[${table}] upsert error: ${error.message}`);
    upserted += chunk.length;
  }

  return upserted;
}

// ─── 단일 소스 동기화 ────────────────────────────────────────────────────────

async function syncSource(source: "factory_register" | "factory_tx" | "land_tx"): Promise<{
  total_fetched: number;
  total_upserted: number;
  error?: string;
}> {
  const startedAt = new Date().toISOString();
  let total_fetched = 0;
  let total_upserted = 0;
  let errorMsg: string | undefined;

  try {
    if (source === "factory_register") {
      const rows = await fetchAllPages("FACTRYREGISTTM");
      total_fetched = rows.length;
      const records = rows.map(toFactoryRegister);
      total_upserted = await upsertBatch("factory_register", records);

    } else if (source === "factory_tx") {
      const rows = await fetchAllPages("TBGRISKABINDUTRADEM");
      total_fetched = rows.length;
      const records = rows.map(toFactoryTransaction);
      total_upserted = await upsertBatch("factory_transactions", records);

    } else {
      const rows = await fetchAllPages("TBGRISKABLANDTRADEM");
      total_fetched = rows.length;
      const records = rows.map(toLandTransaction);
      total_upserted = await upsertBatch("land_transactions", records);
    }
  } catch (e) {
    errorMsg = String(e);
  }

  // 로그 기록
  await supabaseAdmin.from("sync_logs").insert({
    source,
    total_fetched,
    total_upserted,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    error: errorMsg ?? null,
  });

  return { total_fetched, total_upserted, error: errorMsg };
}

// ─── POST Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 인증
  const auth = req.headers.get("authorization") ?? "";
  if (!SYNC_SECRET || auth !== `Bearer ${SYNC_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // source 선택 (기본: 전체)
  const body = await req.json().catch(() => ({})) as { source?: string };
  const source = body.source as "factory_register" | "factory_tx" | "land_tx" | undefined;

  const sources: Array<"factory_register" | "factory_tx" | "land_tx"> = source
    ? [source]
    : ["factory_register", "factory_tx", "land_tx"];

  const results: Record<string, unknown> = {};

  for (const s of sources) {
    results[s] = await syncSource(s);
  }

  return NextResponse.json({ ok: true, results, synced_at: new Date().toISOString() });
}

// 동기화 상태 확인
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  if (!SYNC_SECRET || auth !== `Bearer ${SYNC_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data } = await supabaseAdmin
    .from("sync_logs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(10);

  return NextResponse.json({ logs: data });
}
