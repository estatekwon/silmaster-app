export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MARKER_LIMIT = 500;

// 시군구 중심 좌표 (실거래 데이터는 좌표 없음 → jitter 사용)
const SIGUNGU_CENTERS: Record<string, [number, number]> = {
  "수원시": [37.2636, 127.0286], "성남시": [37.4196, 127.1268],
  "의정부시": [37.7382, 127.0337], "안양시": [37.3943, 126.9568],
  "부천시": [37.5034, 126.7660], "광명시": [37.4784, 126.8647],
  "동두천시": [37.9036, 127.0606], "평택시": [36.9921, 127.1128],
  "안산시": [37.3236, 126.8308], "고양시": [37.6583, 126.8320],
  "과천시": [37.4292, 126.9878], "구리시": [37.5943, 127.1298],
  "남양주시": [37.6360, 127.2164], "오산시": [37.1500, 127.0774],
  "시흥시": [37.3800, 126.8030], "군포시": [37.3614, 126.9352],
  "의왕시": [37.3448, 126.9680], "하남시": [37.5397, 127.2146],
  "용인시": [37.2411, 127.1775], "파주시": [37.7601, 126.7800],
  "이천시": [37.2723, 127.4352], "안성시": [37.0078, 127.2798],
  "김포시": [37.6152, 126.7157], "화성시": [37.1998, 126.8315],
  "광주시": [37.4296, 127.2558], "양주시": [37.7852, 127.0455],
  "포천시": [37.8949, 127.2006], "여주시": [37.2982, 127.6375],
  "연천군": [38.0965, 127.0748], "가평군": [37.8316, 127.5104],
  "양평군": [37.4916, 127.4876],
};

function getSigunguCoords(signguNm: string): [number, number] | null {
  for (const [key, coords] of Object.entries(SIGUNGU_CENTERS)) {
    if (signguNm.includes(key)) return coords;
  }
  return null;
}

function jitter(coord: number, scale = 0.03): number {
  return coord + (Math.random() - 0.5) * scale;
}

// ── 필터 파라미터 파싱 ────────────────────────────────────────────────────────

interface Filters {
  sigungu: string;
  industryType: string;
  areaMin: string;
  areaMax: string;
  priceMin: string;
  priceMax: string;
  yearFrom: string;
  yearTo: string;
  dateFrom: string;
  dateTo: string;
}

function parseFilters(sp: URLSearchParams): Filters {
  return {
    sigungu:      sp.get("sigungu") ?? "",
    industryType: sp.get("industryType") ?? "",
    areaMin:      sp.get("areaMin") ?? "",
    areaMax:      sp.get("areaMax") ?? "",
    priceMin:     sp.get("priceMin") ?? "",
    priceMax:     sp.get("priceMax") ?? "",
    yearFrom:     sp.get("yearFrom") ?? "",
    yearTo:       sp.get("yearTo") ?? "",
    dateFrom:     sp.get("dateFrom") ?? "",  // YYYYMMDD
    dateTo:       sp.get("dateTo") ?? "",    // YYYYMMDD
  };
}

// ── 등록공장 (Supabase — 실제 좌표 있음) ────────────────────────────────────

async function queryFactoryRegister(f: Filters) {
  let q = db
    .from("factory_register")
    .select("id,compny_grp_nm,administ_inst_nm,indutype_desc_dtcont,emply_cnt,lot_ar,subfaclt_ar,factry_scale_div_nm,factry_regist_de,refine_roadnm_addr,lat,lng")
    .not("lat", "is", null)
    .neq("lat", 0)
    .limit(MARKER_LIMIT);

  if (f.sigungu)      q = q.ilike("administ_inst_nm", `%${f.sigungu}%`);
  if (f.industryType) q = q.ilike("indutype_desc_dtcont", `%${f.industryType}%`);
  if (f.areaMin)      q = q.gte("lot_ar", parseFloat(f.areaMin));
  if (f.areaMax)      q = q.lte("lot_ar", parseFloat(f.areaMax));
  if (f.yearFrom)     q = q.gte("factry_regist_de", f.yearFrom + "0101");
  if (f.yearTo)       q = q.lte("factry_regist_de", f.yearTo + "1231");

  const { data, error } = await q;
  if (error) console.error("[markers/factory_register]", error.message);

  return (data ?? []).map((r) => ({ ...r, layer: "factory_register" as const }));
}

// ── 공장·창고 실거래 (Supabase — 시군구 중심 + jitter) ──────────────────────

async function queryFactoryTx(f: Filters) {
  let q = db
    .from("factory_transactions")
    .select("id,signgu_nm,emd_li_nm,contract_day,prvtuse_ar,sitergt_ar,delng_amt,buldng_wk_purpos_nm,build_yy,mdt_div")
    .eq("rlse_yn", "N")
    .order("contract_day", { ascending: false })
    .limit(MARKER_LIMIT);

  if (f.sigungu)      q = q.ilike("signgu_nm", `%${f.sigungu}%`);
  if (f.industryType) q = q.ilike("buldng_wk_purpos_nm", `%${f.industryType}%`);
  if (f.areaMin)      q = q.gte("prvtuse_ar", parseFloat(f.areaMin));
  if (f.areaMax)      q = q.lte("prvtuse_ar", parseFloat(f.areaMax));
  if (f.priceMin)     q = q.gte("delng_amt", parseFloat(f.priceMin));
  if (f.priceMax)     q = q.lte("delng_amt", parseFloat(f.priceMax));
  if (f.dateFrom)     q = q.gte("contract_day", f.dateFrom);
  if (f.dateTo)       q = q.lte("contract_day", f.dateTo);
  if (f.yearFrom)     q = q.gte("contract_day", f.yearFrom + "0101");
  if (f.yearTo)       q = q.lte("contract_day", f.yearTo + "1231");

  const { data, error } = await q;
  if (error) console.error("[markers/factory_tx]", error.message);

  return (data ?? []).map((r) => {
    const coords = getSigunguCoords(r.signgu_nm ?? "");
    if (!coords) return null;
    return { ...r, lat: jitter(coords[0]), lng: jitter(coords[1]), layer: "factory_tx" as const };
  }).filter(Boolean);
}

// ── 토지 실거래 (Supabase — 시군구 중심 + jitter) ───────────────────────────

async function queryLandTx(f: Filters) {
  let q = db
    .from("land_transactions")
    .select("id,signgu_nm,emd_li_nm,contract_day,land_delng_ar,delng_amt,purpos_region_nm,landcgr_nm")
    .eq("rlse_yn", "N")
    .order("contract_day", { ascending: false })
    .limit(MARKER_LIMIT);

  if (f.sigungu)  q = q.ilike("signgu_nm", `%${f.sigungu}%`);
  if (f.areaMin)  q = q.gte("land_delng_ar", parseFloat(f.areaMin));
  if (f.areaMax)  q = q.lte("land_delng_ar", parseFloat(f.areaMax));
  if (f.priceMin) q = q.gte("delng_amt", parseFloat(f.priceMin));
  if (f.priceMax) q = q.lte("delng_amt", parseFloat(f.priceMax));
  if (f.dateFrom) q = q.gte("contract_day", f.dateFrom);
  if (f.dateTo)   q = q.lte("contract_day", f.dateTo);
  if (f.yearFrom) q = q.gte("contract_day", f.yearFrom + "0101");
  if (f.yearTo)   q = q.lte("contract_day", f.yearTo + "1231");

  const { data, error } = await q;
  if (error) console.error("[markers/land_tx]", error.message);

  return (data ?? []).map((r) => {
    const coords = getSigunguCoords(r.signgu_nm ?? "");
    if (!coords) return null;
    return { ...r, lat: jitter(coords[0]), lng: jitter(coords[1]), layer: "land_tx" as const };
  }).filter(Boolean);
}

// ── GET Handler ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const layer = sp.get("layer") ?? "factory_register";
  const filters = parseFilters(sp);

  try {
    let data: unknown[] = [];
    if (layer === "factory_register") data = await queryFactoryRegister(filters);
    else if (layer === "factory_tx")  data = await queryFactoryTx(filters);
    else if (layer === "land_tx")     data = await queryLandTx(filters);

    return NextResponse.json({ markers: data, total: data.length });
  } catch (err) {
    console.error("[markers API]", err);
    return NextResponse.json({ markers: [], total: 0, error: String(err) }, { status: 500 });
  }
}
