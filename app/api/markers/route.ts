import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.GG_API_KEY || "700bdd6a546a4fd7a974271b7d8f5060";
const PAGE_SIZE = 1000;

// 시군구 중심 좌표 (폴백용)
const SIGUNGU_CENTERS: Record<string, [number, number]> = {
  "수원시": [37.2636, 127.0286],
  "성남시": [37.4196, 127.1268],
  "의정부시": [37.7382, 127.0337],
  "안양시": [37.3943, 126.9568],
  "부천시": [37.5034, 126.7660],
  "광명시": [37.4784, 126.8647],
  "동두천시": [37.9036, 127.0606],
  "평택시": [36.9921, 127.1128],
  "안산시": [37.3236, 126.8308],
  "고양시": [37.6583, 126.8320],
  "과천시": [37.4292, 126.9878],
  "구리시": [37.5943, 127.1298],
  "남양주시": [37.6360, 127.2164],
  "오산시": [37.1500, 127.0774],
  "시흥시": [37.3800, 126.8030],
  "군포시": [37.3614, 126.9352],
  "의왕시": [37.3448, 126.9680],
  "하남시": [37.5397, 127.2146],
  "용인시": [37.2411, 127.1775],
  "파주시": [37.7601, 126.7800],
  "이천시": [37.2723, 127.4352],
  "안성시": [37.0078, 127.2798],
  "김포시": [37.6152, 126.7157],
  "화성시": [37.1998, 126.8315],
  "광주시": [37.4296, 127.2558],
  "양주시": [37.7852, 127.0455],
  "포천시": [37.8949, 127.2006],
  "여주시": [37.2982, 127.6375],
  "연천군": [38.0965, 127.0748],
  "가평군": [37.8316, 127.5104],
  "양평군": [37.4916, 127.4876],
};

function getSigunguCoords(signguNm: string): [number, number] | null {
  for (const [key, coords] of Object.entries(SIGUNGU_CENTERS)) {
    if (signguNm.includes(key)) return coords;
  }
  return null;
}

function addJitter(coord: number, scale = 0.01): number {
  return coord + (Math.random() - 0.5) * scale;
}

async function fetchFactoryRegister(page = 1) {
  const url = new URL("https://openapi.gg.go.kr/FACTRYREGISTTM");
  url.searchParams.set("KEY", API_KEY);
  url.searchParams.set("Type", "json");
  url.searchParams.set("pIndex", String(page));
  url.searchParams.set("pSize", String(PAGE_SIZE));

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  const json = await res.json();

  const rows = json?.FACTRYREGISTTM?.[1]?.row ?? [];
  return rows.map((r: Record<string, string>, idx: number) => ({
    id: `fr_${page}_${idx}`,
    compny_grp_nm: r.COMPNY_GRP_NM || "",
    administ_inst_nm: r.ADMINIST_INST_NM || "",
    indutype_desc_dtcont: r.INDUTYPE_DESC_DTCONT || "",
    emply_cnt: r.EMPLY_CNT || "0",
    lot_ar: r.LOT_AR || "0",
    subfaclt_ar: r.SUBFACLT_AR || "0",
    factry_scale_div_nm: r.FACTRY_SCALE_DIV_NM || "",
    factry_regist_de: r.FACTRY_REGIST_DE || "",
    refine_roadnm_addr: r.REFINE_ROADNM_ADDR || "",
    lat: parseFloat(r.REFINE_WGS84_LAT) || 0,
    lng: parseFloat(r.REFINE_WGS84_LOGT) || 0,
    layer: "factory_register" as const,
  })).filter((m: { lat: number; lng: number }) => m.lat && m.lng);
}

async function fetchFactoryTransaction(page = 1) {
  const url = new URL("https://openapi.gg.go.kr/TBGRISKABINDUTRADEM");
  url.searchParams.set("KEY", API_KEY);
  url.searchParams.set("Type", "json");
  url.searchParams.set("pIndex", String(page));
  url.searchParams.set("pSize", String(PAGE_SIZE));

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  const json = await res.json();

  const rows = json?.TBGRISKABINDUTRADEM?.[1]?.row ?? [];
  return rows.map((r: Record<string, string>, idx: number) => {
    const coords = getSigunguCoords(r.SIGNGU_NM || "");
    if (!coords) return null;
    return {
      id: `ft_${page}_${idx}`,
      signgu_nm: r.SIGNGU_NM || "",
      emd_li_nm: r.EMD_LI_NM || "",
      contract_day: r.CONTRACT_DAY || "",
      prvtuse_ar: r.PRVTUSE_AR || "0",
      delng_amt: r.DELNG_AMT || "0",
      buldng_wk_purpos_nm: r.BULDNG_WK_PURPOS_NM || "",
      build_yy: r.BUILD_YY || "",
      lat: addJitter(coords[0], 0.03),
      lng: addJitter(coords[1], 0.03),
      layer: "factory_tx" as const,
    };
  }).filter(Boolean);
}

async function fetchLandTransaction(page = 1) {
  const url = new URL("https://openapi.gg.go.kr/TBGRISKABLANDTRADEM");
  url.searchParams.set("KEY", API_KEY);
  url.searchParams.set("Type", "json");
  url.searchParams.set("pIndex", String(page));
  url.searchParams.set("pSize", String(PAGE_SIZE));

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  const json = await res.json();

  const rows = json?.TBGRISKABLANDTRADEM?.[1]?.row ?? [];
  return rows.map((r: Record<string, string>, idx: number) => {
    const coords = getSigunguCoords(r.SIGNGU_NM || "");
    if (!coords) return null;
    return {
      id: `lt_${page}_${idx}`,
      signgu_nm: r.SIGNGU_NM || "",
      emd_li_nm: r.EMD_LI_NM || "",
      contract_day: r.CONTRACT_DAY || "",
      land_delng_ar: r.LAND_DELNG_AR || "0",
      delng_amt: r.DELNG_AMT || "0",
      purpos_region_nm: r.PURPOS_REGION_NM || "",
      landcgr_nm: r.LANDCGR_NM || "",
      lat: addJitter(coords[0], 0.03),
      lng: addJitter(coords[1], 0.03),
      layer: "land_tx" as const,
    };
  }).filter(Boolean);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const layer = searchParams.get("layer") ?? "factory_register";

  try {
    let data: unknown[] = [];

    if (layer === "factory_register") {
      data = await fetchFactoryRegister(1);
    } else if (layer === "factory_tx") {
      data = await fetchFactoryTransaction(1);
    } else if (layer === "land_tx") {
      data = await fetchLandTransaction(1);
    }

    return NextResponse.json({ markers: data, total: data.length });
  } catch (err) {
    console.error("[markers API]", err);
    return NextResponse.json({ markers: [], total: 0, error: String(err) }, { status: 500 });
  }
}
