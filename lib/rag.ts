/**
 * RAG context builder
 * 사용자 질문에서 시군구·면적·기간 키워드를 추출해
 * Supabase에서 관련 실거래 데이터를 조회하고 자연어 컨텍스트로 변환합니다.
 */

import { supabaseAdmin } from "./supabase";
import { formatAmount, formatArea } from "./format";

// ─── 경기도 시군구 목록 ──────────────────────────────────────────────────────

const SIGUNGU_LIST = [
  "수원", "성남", "의정부", "안양", "부천", "광명", "동두천", "평택",
  "안산", "고양", "과천", "구리", "남양주", "오산", "시흥", "군포",
  "의왕", "하남", "용인", "파주", "이천", "안성", "김포", "화성",
  "광주", "양주", "포천", "여주", "연천", "가평", "양평",
  "동탄", "반월", "시화",
];

const BUILDING_TYPES: Record<string, string[]> = {
  "공장": ["공장"],
  "창고": ["창고", "물류"],
  "물류": ["창고", "물류"],
  "토지": ["토지"],
};

// ─── 키워드 추출 ─────────────────────────────────────────────────────────────

interface QueryKeywords {
  sigungu: string | null;
  buildingType: string[] | null;
  areaMin: number | null;
  areaMax: number | null;
  isLandQuery: boolean;
}

function extractKeywords(query: string): QueryKeywords {
  const sigungu = SIGUNGU_LIST.find((s) => query.includes(s)) ?? null;

  let buildingType: string[] | null = null;
  for (const [kw, types] of Object.entries(BUILDING_TYPES)) {
    if (query.includes(kw)) { buildingType = types; break; }
  }

  // 면적 추출: "300평", "500㎡"
  const pyeongMatch = query.match(/(\d+)\s*평/);
  const m2Match = query.match(/(\d+)\s*㎡/);
  let areaMin: number | null = null;
  let areaMax: number | null = null;
  if (pyeongMatch) {
    const pyeong = parseInt(pyeongMatch[1]);
    areaMin = Math.floor(pyeong * 3.3058 * 0.7);
    areaMax = Math.ceil(pyeong * 3.3058 * 1.3);
  } else if (m2Match) {
    const m2 = parseInt(m2Match[1]);
    areaMin = Math.floor(m2 * 0.7);
    areaMax = Math.ceil(m2 * 1.3);
  }

  const isLandQuery = query.includes("토지") || query.includes("땅") || query.includes("지목");

  return { sigungu, buildingType, areaMin, areaMax, isLandQuery };
}

// ─── 공장·창고 실거래 조회 ───────────────────────────────────────────────────

interface FactoryTxRow {
  signgu_nm: string;
  emd_li_nm: string;
  contract_day: string;
  prvtuse_ar: number;
  sitergt_ar: number;
  delng_amt: number;
  buldng_wk_purpos_nm: string;
  build_yy: string;
  mdt_div: string;
}

async function fetchFactoryContext(kw: QueryKeywords): Promise<string> {
  let q = supabaseAdmin
    .from("factory_transactions")
    .select("signgu_nm,emd_li_nm,contract_day,prvtuse_ar,sitergt_ar,delng_amt,buldng_wk_purpos_nm,build_yy,mdt_div")
    .eq("rlse_yn", "N")
    .order("contract_day", { ascending: false })
    .limit(20);

  if (kw.sigungu) q = q.ilike("signgu_nm", `%${kw.sigungu}%`);
  if (kw.buildingType) {
    q = q.or(kw.buildingType.map((t) => `buldng_wk_purpos_nm.ilike.%${t}%`).join(","));
  }
  if (kw.areaMin != null) q = q.gte("prvtuse_ar", kw.areaMin);
  if (kw.areaMax != null) q = q.lte("prvtuse_ar", kw.areaMax);

  const { data, error } = await q;
  if (error || !data?.length) return "";

  const rows = data as FactoryTxRow[];

  // 집계
  const totalCount = rows.length;
  const avgPrice = Math.round(rows.reduce((s, r) => s + Number(r.delng_amt), 0) / totalCount);
  const avgM2 = Math.round(rows.reduce((s, r) => s + Number(r.prvtuse_ar), 0) / totalCount);
  const periodFrom = rows[rows.length - 1]?.contract_day?.slice(0, 6) ?? "";
  const periodTo = rows[0]?.contract_day?.slice(0, 6) ?? "";

  const lines = [
    `## 공장·창고 실거래 데이터 (${kw.sigungu ?? "경기도 전체"})`,
    `조회건수: ${totalCount}건 | 기간: ${periodFrom}~${periodTo} | 평균면적: ${formatArea(avgM2)} | 평균거래가: ${formatAmount(avgPrice)}`,
    "",
    "### 최근 거래 목록",
    ...rows.slice(0, 15).map((r) => {
      const pricePerM2 = r.prvtuse_ar > 0
        ? Math.round(Number(r.delng_amt) / Number(r.prvtuse_ar))
        : 0;
      return `- ${r.signgu_nm} ${r.emd_li_nm} | ${r.buldng_wk_purpos_nm} | 전용 ${formatArea(r.prvtuse_ar)} | 대지 ${formatArea(r.sitergt_ar)} | ${formatAmount(r.delng_amt)} (㎡당 ${formatAmount(pricePerM2)}) | 계약 ${r.contract_day} | 건축 ${r.build_yy}년 | ${r.mdt_div}`;
    }),
  ];

  return lines.join("\n");
}

// ─── 토지 실거래 조회 ─────────────────────────────────────────────────────────

interface LandTxRow {
  signgu_nm: string;
  emd_li_nm: string;
  contract_day: string;
  land_delng_ar: number;
  delng_amt: number;
  purpos_region_nm: string;
  landcgr_nm: string;
}

async function fetchLandContext(kw: QueryKeywords): Promise<string> {
  let q = supabaseAdmin
    .from("land_transactions")
    .select("signgu_nm,emd_li_nm,contract_day,land_delng_ar,delng_amt,purpos_region_nm,landcgr_nm")
    .eq("rlse_yn", "N")
    .order("contract_day", { ascending: false })
    .limit(15);

  if (kw.sigungu) q = q.ilike("signgu_nm", `%${kw.sigungu}%`);
  if (kw.areaMin != null) q = q.gte("land_delng_ar", kw.areaMin);
  if (kw.areaMax != null) q = q.lte("land_delng_ar", kw.areaMax);

  const { data, error } = await q;
  if (error || !data?.length) return "";

  const rows = data as LandTxRow[];
  const totalCount = rows.length;
  const avgPrice = Math.round(rows.reduce((s, r) => s + Number(r.delng_amt), 0) / totalCount);

  const lines = [
    `## 토지 실거래 데이터 (${kw.sigungu ?? "경기도 전체"})`,
    `조회건수: ${totalCount}건 | 평균거래가: ${formatAmount(avgPrice)}`,
    "",
    "### 최근 거래 목록",
    ...rows.slice(0, 12).map((r) => {
      const perM2 = r.land_delng_ar > 0
        ? Math.round(Number(r.delng_amt) / Number(r.land_delng_ar))
        : 0;
      return `- ${r.signgu_nm} ${r.emd_li_nm} | 면적 ${formatArea(r.land_delng_ar)} | ${formatAmount(r.delng_amt)} (㎡당 ${formatAmount(perM2)}) | 용도 ${r.purpos_region_nm} | 지목 ${r.landcgr_nm} | 계약 ${r.contract_day}`;
    }),
  ];

  return lines.join("\n");
}

// ─── 공장 등록 현황 조회 ──────────────────────────────────────────────────────

interface FactoryRegisterRow {
  compny_grp_nm: string;
  administ_inst_nm: string;
  indutype_desc_dtcont: string;
  lot_ar: number;
  subfaclt_ar: number;
  emply_cnt: string;
  factry_scale_div_nm: string;
}

async function fetchRegisterContext(kw: QueryKeywords): Promise<string> {
  let q = supabaseAdmin
    .from("factory_register")
    .select("compny_grp_nm,administ_inst_nm,indutype_desc_dtcont,lot_ar,subfaclt_ar,emply_cnt,factry_scale_div_nm")
    .order("lot_ar", { ascending: false })
    .limit(10);

  if (kw.sigungu) q = q.ilike("administ_inst_nm", `%${kw.sigungu}%`);

  const { data, error } = await q;
  if (error || !data?.length) return "";

  const rows = data as FactoryRegisterRow[];
  const lines = [
    `## 공장 등록 현황 (${kw.sigungu ?? "경기도 전체"})`,
    `조회건수: ${rows.length}건`,
    "",
    ...rows.map((r) =>
      `- ${r.administ_inst_nm} | ${r.compny_grp_nm} | 업종: ${r.indutype_desc_dtcont} | 부지 ${formatArea(r.lot_ar)} | 종업원 ${r.emply_cnt}명 | 규모: ${r.factry_scale_div_nm}`
    ),
  ];

  return lines.join("\n");
}

// ─── 메인 export ─────────────────────────────────────────────────────────────

export interface RagContext {
  context: string;
  hasData: boolean;
}

export async function buildRagContext(query: string): Promise<RagContext> {
  const kw = extractKeywords(query);

  const [factoryCtx, landCtx, registerCtx] = await Promise.all([
    kw.isLandQuery ? Promise.resolve("") : fetchFactoryContext(kw),
    kw.isLandQuery ? fetchLandContext(kw) : fetchLandContext(kw),
    fetchRegisterContext(kw),
  ]);

  const parts = [factoryCtx, landCtx, registerCtx].filter(Boolean);
  if (!parts.length) return { context: "", hasData: false };

  return {
    context: parts.join("\n\n---\n\n"),
    hasData: true,
  };
}
