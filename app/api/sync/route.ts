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
  const statmnt_no = r.STATMNT_NO ?? "";
  const contract_day = r.CONTRACT_DAY ?? "";
  // 토지 API에는 THING_SEQ_NO 필드 없음 → STATMNT_NO + CONTRACT_DAY로 유니크 ID 구성
  const id = `lt_${recept_yy}_${recept_no}_${statmnt_no}_${contract_day}`;

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

async function upsertBatch<T extends object & { id: string }>(table: string, rows: T[]): Promise<number> {
  const BATCH = 500;
  let upserted = 0;

  // 소스 데이터 내 중복 ID 제거
  const seen = new Set<string>();
  rows = rows.filter((r) => { if (seen.has(r.id)) return false; seen.add(r.id); return true; });

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

// 60일 롤링 윈도우: CONTRACT_DAY 기준 최근 60일 필터
function getRollingCutoff(): string {
  const d = new Date();
  d.setDate(d.getDate() - 60);
  return d.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
}

async function syncSource(
  source: "factory_register" | "factory_tx" | "land_tx",
  rolling = false,
): Promise<{ total_fetched: number; total_upserted: number; error?: string }> {
  const startedAt = new Date().toISOString();
  let total_fetched = 0;
  let total_upserted = 0;
  let errorMsg: string | undefined;
  const cutoff = rolling ? getRollingCutoff() : null;

  try {
    if (source === "factory_register") {
      // 공장등록현황은 rolling 불필요 — 항상 전체
      const rows = await fetchAllPages("FACTRYREGISTTM");
      total_fetched = rows.length;
      const records = rows.map(toFactoryRegister);
      total_upserted = await upsertBatch("factory_register", records);

    } else if (source === "factory_tx") {
      let rows = await fetchAllPages("TBGRISKABINDUTRADEM");
      if (cutoff) rows = rows.filter((r) => (r.CONTRACT_DAY ?? "") >= cutoff);
      total_fetched = rows.length;
      const records = rows.map(toFactoryTransaction);
      total_upserted = await upsertBatch("factory_transactions", records);

    } else {
      let rows = await fetchAllPages("TBGRISKABLANDTRADEM");
      if (cutoff) rows = rows.filter((r) => (r.CONTRACT_DAY ?? "") >= cutoff);
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

// ─── 최신 수집 기준일 조회 ──────────────────────────────────────────────────

async function getLatestSyncDate(): Promise<string | null> {
  // factory_transactions에서 가장 최근 contract_day 반환
  const { data } = await supabaseAdmin
    .from("factory_transactions")
    .select("contract_day")
    .neq("rlse_yn", "C")
    .order("contract_day", { ascending: false })
    .limit(1);
  return data?.[0]?.contract_day ?? null;
}

export async function POST(req: NextRequest) {
  // 인증
  const auth = req.headers.get("authorization") ?? "";
  if (!SYNC_SECRET || auth !== `Bearer ${SYNC_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // source 및 모드 선택
  const body = await req.json().catch(() => ({})) as { source?: string; rolling?: boolean };
  const source = body.source as "factory_register" | "factory_tx" | "land_tx" | undefined;
  const rolling = body.rolling ?? false; // true: 최근 60일 재수집 모드

  const sources: Array<"factory_register" | "factory_tx" | "land_tx"> = source
    ? [source]
    : ["factory_register", "factory_tx", "land_tx"];

  const results: Record<string, unknown> = {};

  for (const s of sources) {
    results[s] = await syncSource(s, rolling);
  }

  const latestDate = await getLatestSyncDate();

  return NextResponse.json({ ok: true, results, synced_at: new Date().toISOString(), latest_contract_day: latestDate });
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
