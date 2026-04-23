/**
 * RAG context builder — pgvector 벡터 검색 우선, SQL 키워드 검색 폴백
 */

import { supabaseAdmin } from "./supabase";
import { formatAmount, formatArea } from "./format";

const GEMINI_KEY = process.env.GEMINI_API_KEY!;

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

// ─── Gemini 쿼리 임베딩 ──────────────────────────────────────────────────────

async function embedQuery(query: string): Promise<number[] | null> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "models/text-embedding-004",
          content: { parts: [{ text: query }] },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json() as { embedding: { values: number[] } };
    return data.embedding.values;
  } catch {
    return null;
  }
}

// ─── 벡터 검색 ──────────────────────────────────────────────────────────────

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
  similarity?: number;
}

interface LandTxRow {
  signgu_nm: string;
  emd_li_nm: string;
  contract_day: string;
  land_delng_ar: number;
  delng_amt: number;
  purpos_region_nm: string;
  landcgr_nm: string;
  similarity?: number;
}

interface FactoryRegisterRow {
  compny_grp_nm: string;
  administ_inst_nm: string;
  indutype_desc_dtcont: string;
  lot_ar: number;
  subfaclt_ar: number;
  emply_cnt: string;
  factry_scale_div_nm: string;
  similarity?: number;
}

async function vectorSearchFactoryTx(embedding: number[], kw: QueryKeywords): Promise<FactoryTxRow[]> {
  const { data, error } = await supabaseAdmin.rpc("match_factory_transactions", {
    query_embedding: `[${embedding.join(",")}]`,
    match_count: 20,
  });
  if (error || !data?.length) return [];

  let rows = data as FactoryTxRow[];

  // 시군구 필터
  if (kw.sigungu) rows = rows.filter((r) => r.signgu_nm?.includes(kw.sigungu!));
  // 면적 필터
  if (kw.areaMin != null) rows = rows.filter((r) => Number(r.prvtuse_ar) >= kw.areaMin!);
  if (kw.areaMax != null) rows = rows.filter((r) => Number(r.prvtuse_ar) <= kw.areaMax!);

  return rows;
}

async function vectorSearchLandTx(embedding: number[], kw: QueryKeywords): Promise<LandTxRow[]> {
  const { data, error } = await supabaseAdmin.rpc("match_land_transactions", {
    query_embedding: `[${embedding.join(",")}]`,
    match_count: 15,
  });
  if (error || !data?.length) return [];

  let rows = data as LandTxRow[];
  if (kw.sigungu) rows = rows.filter((r) => r.signgu_nm?.includes(kw.sigungu!));
  if (kw.areaMin != null) rows = rows.filter((r) => Number(r.land_delng_ar) >= kw.areaMin!);
  if (kw.areaMax != null) rows = rows.filter((r) => Number(r.land_delng_ar) <= kw.areaMax!);

  return rows;
}

async function vectorSearchRegister(embedding: number[], kw: QueryKeywords): Promise<FactoryRegisterRow[]> {
  const { data, error } = await supabaseAdmin.rpc("match_factory_register", {
    query_embedding: `[${embedding.join(",")}]`,
    match_count: 10,
  });
  if (error || !data?.length) return [];

  let rows = data as FactoryRegisterRow[];
  if (kw.sigungu) rows = rows.filter((r) => r.administ_inst_nm?.includes(kw.sigungu!));

  return rows;
}

// ─── SQL 폴백 검색 ───────────────────────────────────────────────────────────

async function sqlSearchFactoryTx(kw: QueryKeywords): Promise<FactoryTxRow[]> {
  let q = supabaseAdmin
    .from("factory_transactions")
    .select("signgu_nm,emd_li_nm,contract_day,prvtuse_ar,sitergt_ar,delng_amt,buldng_wk_purpos_nm,build_yy,mdt_div")
    .neq("rlse_yn", "C")
    .order("contract_day", { ascending: false })
    .limit(20);

  if (kw.sigungu) q = q.ilike("signgu_nm", `%${kw.sigungu}%`);
  if (kw.buildingType) {
    q = q.or(kw.buildingType.map((t) => `buldng_wk_purpos_nm.ilike.%${t}%`).join(","));
  }
  if (kw.areaMin != null) q = q.gte("prvtuse_ar", kw.areaMin);
  if (kw.areaMax != null) q = q.lte("prvtuse_ar", kw.areaMax);

  const { data, error } = await q;
  if (error || !data?.length) return [];
  return data as FactoryTxRow[];
}

async function sqlSearchLandTx(kw: QueryKeywords): Promise<LandTxRow[]> {
  let q = supabaseAdmin
    .from("land_transactions")
    .select("signgu_nm,emd_li_nm,contract_day,land_delng_ar,delng_amt,purpos_region_nm,landcgr_nm")
    .neq("rlse_yn", "C")
    .order("contract_day", { ascending: false })
    .limit(15);

  if (kw.sigungu) q = q.ilike("signgu_nm", `%${kw.sigungu}%`);
  if (kw.areaMin != null) q = q.gte("land_delng_ar", kw.areaMin);
  if (kw.areaMax != null) q = q.lte("land_delng_ar", kw.areaMax);

  const { data, error } = await q;
  if (error || !data?.length) return [];
  return data as LandTxRow[];
}

async function sqlSearchRegister(kw: QueryKeywords): Promise<FactoryRegisterRow[]> {
  let q = supabaseAdmin
    .from("factory_register")
    .select("compny_grp_nm,administ_inst_nm,indutype_desc_dtcont,lot_ar,subfaclt_ar,emply_cnt,factry_scale_div_nm")
    .order("lot_ar", { ascending: false })
    .limit(10);

  if (kw.sigungu) q = q.ilike("administ_inst_nm", `%${kw.sigungu}%`);

  const { data, error } = await q;
  if (error || !data?.length) return [];
  return data as FactoryRegisterRow[];
}

// ─── 컨텍스트 포맷 ──────────────────────────────────────────────────────────

function formatFactoryTx(rows: FactoryTxRow[], sigungu: string | null): string {
  if (!rows.length) return "";
  const totalCount = rows.length;
  const avgPrice = Math.round(rows.reduce((s, r) => s + Number(r.delng_amt), 0) / totalCount);
  const avgM2 = Math.round(rows.reduce((s, r) => s + Number(r.prvtuse_ar), 0) / totalCount);
  const periodFrom = rows[rows.length - 1]?.contract_day?.slice(0, 6) ?? "";
  const periodTo = rows[0]?.contract_day?.slice(0, 6) ?? "";

  return [
    `## 공장·창고 실거래 데이터 (${sigungu ?? "경기도 전체"})`,
    `조회건수: ${totalCount}건 | 기간: ${periodFrom}~${periodTo} | 평균면적: ${formatArea(avgM2)} | 평균거래가: ${formatAmount(avgPrice)}`,
    "",
    "### 최근 거래 목록",
    ...rows.slice(0, 15).map((r) => {
      const pricePerM2 = Number(r.prvtuse_ar) > 0
        ? Math.round(Number(r.delng_amt) / Number(r.prvtuse_ar))
        : 0;
      return `- ${r.signgu_nm} ${r.emd_li_nm} | ${r.buldng_wk_purpos_nm} | 전용 ${formatArea(Number(r.prvtuse_ar))} | 대지 ${formatArea(Number(r.sitergt_ar))} | ${formatAmount(Number(r.delng_amt))} (㎡당 ${formatAmount(pricePerM2)}) | 계약 ${r.contract_day} | 건축 ${r.build_yy}년 | ${r.mdt_div}`;
    }),
  ].join("\n");
}

function formatLandTx(rows: LandTxRow[], sigungu: string | null): string {
  if (!rows.length) return "";
  const totalCount = rows.length;
  const avgPrice = Math.round(rows.reduce((s, r) => s + Number(r.delng_amt), 0) / totalCount);

  return [
    `## 토지 실거래 데이터 (${sigungu ?? "경기도 전체"})`,
    `조회건수: ${totalCount}건 | 평균거래가: ${formatAmount(avgPrice)}`,
    "",
    "### 최근 거래 목록",
    ...rows.slice(0, 12).map((r) => {
      const perM2 = Number(r.land_delng_ar) > 0
        ? Math.round(Number(r.delng_amt) / Number(r.land_delng_ar))
        : 0;
      return `- ${r.signgu_nm} ${r.emd_li_nm} | 면적 ${formatArea(Number(r.land_delng_ar))} | ${formatAmount(Number(r.delng_amt))} (㎡당 ${formatAmount(perM2)}) | 용도 ${r.purpos_region_nm} | 지목 ${r.landcgr_nm} | 계약 ${r.contract_day}`;
    }),
  ].join("\n");
}

function formatRegister(rows: FactoryRegisterRow[], sigungu: string | null): string {
  if (!rows.length) return "";
  return [
    `## 공장 등록 현황 (${sigungu ?? "경기도 전체"})`,
    `조회건수: ${rows.length}건`,
    "",
    ...rows.map((r) =>
      `- ${r.administ_inst_nm} | ${r.compny_grp_nm} | 업종: ${r.indutype_desc_dtcont} | 부지 ${formatArea(Number(r.lot_ar))} | 종업원 ${r.emply_cnt}명 | 규모: ${r.factry_scale_div_nm}`
    ),
  ].join("\n");
}

// ─── 메인 export ─────────────────────────────────────────────────────────────

export interface RagContext {
  context: string;
  hasData: boolean;
  searchMode: "vector" | "sql";
  rowCount: number;
}

export async function buildRagContext(query: string): Promise<RagContext> {
  const kw = extractKeywords(query);

  // 1. 쿼리 임베딩 시도
  const embedding = await embedQuery(query);

  let factoryRows: FactoryTxRow[] = [];
  let landRows: LandTxRow[] = [];
  let registerRows: FactoryRegisterRow[] = [];
  let searchMode: "vector" | "sql" = "sql";

  if (embedding) {
    // 2a. 벡터 검색
    [factoryRows, landRows, registerRows] = await Promise.all([
      kw.isLandQuery ? Promise.resolve([]) : vectorSearchFactoryTx(embedding, kw),
      kw.isLandQuery ? vectorSearchLandTx(embedding, kw) : Promise.resolve([]),
      vectorSearchRegister(embedding, kw),
    ]);

    // 벡터 결과가 있으면 vector 모드
    if (factoryRows.length > 0 || landRows.length > 0) {
      searchMode = "vector";
    }
  }

  // 2b. 벡터 결과 없으면 SQL 폴백
  if (searchMode === "sql") {
    [factoryRows, landRows, registerRows] = await Promise.all([
      kw.isLandQuery ? Promise.resolve([]) : sqlSearchFactoryTx(kw),
      kw.isLandQuery ? sqlSearchLandTx(kw) : Promise.resolve([]),
      sqlSearchRegister(kw),
    ]);
  }

  const parts = [
    formatFactoryTx(factoryRows, kw.sigungu),
    formatLandTx(landRows, kw.sigungu),
    formatRegister(registerRows, kw.sigungu),
  ].filter(Boolean);

  const rowCount = factoryRows.length + landRows.length + registerRows.length;

  if (!parts.length) return { context: "", hasData: false, searchMode, rowCount: 0 };

  return {
    context: parts.join("\n\n---\n\n"),
    hasData: true,
    searchMode,
    rowCount,
  };
}
