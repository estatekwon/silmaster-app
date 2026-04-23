export const runtime = "nodejs";
export const maxDuration = 300;

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const GEMINI_KEY = process.env.GEMINI_API_KEY!;
const SYNC_SECRET = process.env.SYNC_SECRET!;
const BATCH_SIZE = 50; // Gemini embedding batch limit

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Gemini 임베딩 호출 ───────────────────────────────────────────────────────

async function embedTexts(texts: string[]): Promise<number[][]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/text-embedding-004:batchEmbedContents?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: texts.map((text) => ({
          model: "models/text-embedding-004",
          content: { parts: [{ text }] },
        })),
      }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini embedding error: ${res.status} ${err}`);
  }
  const data = await res.json() as { embeddings: Array<{ values: number[] }> };
  return data.embeddings.map((e) => e.values);
}

// ── 텍스트 변환 ──────────────────────────────────────────────────────────────

function factoryTxText(r: Record<string, unknown>): string {
  const amt = Number(r.delng_amt ?? 0);
  const ar = Number(r.prvtuse_ar ?? 0);
  const perPyeong = ar > 0 ? Math.round(amt / (ar / 3.3)) : 0;
  return (
    `${r.signgu_nm} ${r.emd_li_nm} ${r.buldng_wk_purpos_nm} 실거래. ` +
    `계약일: ${r.contract_day}. ` +
    `건물면적 ${ar}㎡(${Math.round(ar / 3.3)}평). ` +
    `거래금액 ${(amt / 10000).toFixed(1)}억원 (평당 ${perPyeong}만원). ` +
    `건축연도: ${r.build_yy}년. 거래유형: ${r.mdt_div}.`
  );
}

function landTxText(r: Record<string, unknown>): string {
  const amt = Number(r.delng_amt ?? 0);
  const ar = Number(r.land_delng_ar ?? 0);
  const perM2 = ar > 0 ? Math.round(amt / ar) : 0;
  return (
    `${r.signgu_nm} ${r.emd_li_nm} 토지 실거래. ` +
    `계약일: ${r.contract_day}. ` +
    `면적 ${ar}㎡(${Math.round(ar / 3.3)}평). ` +
    `거래금액 ${(amt / 10000).toFixed(1)}억원 (㎡당 ${perM2}만원). ` +
    `지목: ${r.landcgr_nm}. 용도: ${r.purpos_region_nm}.`
  );
}

function factoryRegisterText(r: Record<string, unknown>): string {
  return (
    `${r.administ_inst_nm} 소재 ${r.compny_grp_nm}. ` +
    `업종: ${r.indutype_desc_dtcont}. ` +
    `부지 ${Number(r.lot_ar)}㎡(${Math.round(Number(r.lot_ar) / 3.3)}평). ` +
    `종업원 ${r.emply_cnt}명. 규모: ${r.factry_scale_div_nm}.`
  );
}

// ── 테이블별 임베딩 배치 ─────────────────────────────────────────────────────

async function embedTable(
  table: string,
  textFn: (r: Record<string, unknown>) => string,
  log: string[]
): Promise<number> {
  let processed = 0;
  let offset = 0;

  while (true) {
    const { data, error } = await db
      .from(table)
      .select("*")
      .is("embedding", null)
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) { log.push(`[${table}] query error: ${error.message}`); break; }
    if (!data || data.length === 0) break;

    const texts = data.map((r) => textFn(r as Record<string, unknown>));
    let embeddings: number[][];
    try {
      embeddings = await embedTexts(texts);
    } catch (e) {
      log.push(`[${table}] embed error: ${String(e)}`);
      break;
    }

    for (let i = 0; i < data.length; i++) {
      await db
        .from(table)
        .update({ embedding: `[${embeddings[i].join(",")}]` })
        .eq("id", (data[i] as Record<string, unknown>).id);
    }

    processed += data.length;
    offset += BATCH_SIZE;
    log.push(`[${table}] ${processed}건 완료`);

    if (data.length < BATCH_SIZE) break;
  }

  return processed;
}

// ── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${SYNC_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const log: string[] = [];
  const body = await req.json().catch(() => ({})) as { table?: string };
  const targetTable = body.table; // 특정 테이블만 실행 가능

  const results: Record<string, number> = {};

  if (!targetTable || targetTable === "factory_transactions") {
    results.factory_transactions = await embedTable("factory_transactions", factoryTxText, log);
  }
  if (!targetTable || targetTable === "land_transactions") {
    results.land_transactions = await embedTable("land_transactions", landTxText, log);
  }
  if (!targetTable || targetTable === "factory_register") {
    results.factory_register = await embedTable("factory_register", factoryRegisterText, log);
  }

  return NextResponse.json({ success: true, results, log });
}
