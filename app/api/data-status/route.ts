/**
 * GET /api/data-status
 * 데이터 기준일 공개 엔드포인트 (인증 불필요)
 * 챗봇 UI에서 "데이터 기준: YYYY년 MM월" 표시에 사용
 */

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data } = await supabaseAdmin
    .from("factory_transactions")
    .select("contract_day")
    .neq("rlse_yn", "C")
    .order("contract_day", { ascending: false })
    .limit(1);

  const latestDay = data?.[0]?.contract_day ?? null;

  // YYYYMMDD → "YYYY년 MM월"
  let label = "데이터 준비 중";
  if (latestDay && latestDay.length >= 6) {
    const year = latestDay.slice(0, 4);
    const month = latestDay.slice(4, 6);
    label = `${year}년 ${parseInt(month, 10)}월`;
  }

  return NextResponse.json(
    { latest_contract_day: latestDay, label },
    { headers: { "Cache-Control": "public, max-age=3600" } }
  );
}
