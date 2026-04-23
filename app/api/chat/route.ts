import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const FREE_DAILY_LIMIT = 5;
const COOKIE_NAME = "chat_usage";

// ─── Rate Limit (쿠키 기반, edge 호환) ─────────────────────────────────────

interface UsageRecord {
  count: number;
  date: string; // YYYY-MM-DD KST
}

function getTodayKST(): string {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  )
    .toISOString()
    .slice(0, 10);
}

function parseUsage(raw: string | undefined): UsageRecord {
  if (!raw) return { count: 0, date: getTodayKST() };
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as UsageRecord;
    if (parsed.date !== getTodayKST()) return { count: 0, date: getTodayKST() };
    return parsed;
  } catch {
    return { count: 0, date: getTodayKST() };
  }
}

// ─── 도메인 필터 ───────────────────────────────────────────────────────────

const RESIDENTIAL_KEYWORDS = ["아파트", "주택", "빌라", "오피스텔", "상가", "전세", "월세", "재건축", "재개발"];
const OUT_OF_REGION = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "제주", "강원", "충북", "충남", "전북", "전남", "경북", "경남"];
const UNRELATED = ["주식", "코인", "날씨", "뉴스", "환율"];

const IN_SCOPE = [
  "공장", "창고", "물류", "산업단지", "공업", "제조", "토지", "부지",
  "공장용지", "시세", "실거래", "평단가", "평균가", "거래가", "경기도",
  "수원", "화성", "용인", "평택", "안산", "시흥", "파주", "김포",
  "광주", "이천", "안성", "여주", "양주", "포천", "가평", "양평",
  "동두천", "과천", "군포", "의왕", "오산", "하남", "남양주", "구리",
  "의정부", "고양", "부천", "성남", "반월", "시화", "동탄",
];

type DomainResult = { valid: true } | { valid: false; message: string };

function checkDomain(query: string): DomainResult {
  for (const kw of RESIDENTIAL_KEYWORDS) {
    if (query.includes(kw)) {
      return { valid: false, message: "저는 산업용 부동산(공장·창고·토지) 전문입니다. 주거용 부동산은 안내드리기 어렵습니다." };
    }
  }
  for (const kw of OUT_OF_REGION) {
    if (query.includes(kw)) {
      return { valid: false, message: "죄송합니다. 현재는 경기도 데이터만 제공합니다. 경기도 공장·창고·토지 시세를 질문해 주세요." };
    }
  }
  for (const kw of UNRELATED) {
    if (query.includes(kw)) {
      return { valid: false, message: "경기도 공장·창고·토지 실거래가에 대해 질문해 주세요.\n예: '화성시 물류창고 평단가 알려줘'" };
    }
  }
  // 관련 키워드 전혀 없고 짧으면 decline
  const hasRelevant = IN_SCOPE.some((kw) => query.includes(kw));
  if (!hasRelevant && query.length < 12) {
    return { valid: false, message: "경기도 공장·창고·토지 실거래가에 대해 질문해 주세요.\n예: '수원시 300평 공장 시세 알려줘'" };
  }
  return { valid: true };
}

// ─── 시스템 프롬프트 ────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `당신은 경기도 산업용 부동산 전문 AI 어시스턴트 "실거래마스터 AI"입니다.

[역할]
경기도 공장, 창고, 토지의 실거래가 데이터를 기반으로 정확한 시세 정보를 제공합니다.
투자 분석, 지역 비교, 업종별 시세 트렌드를 안내합니다.

[제공 데이터]
- 경기도 공장등록현황: 78,552건 (위치·업종·규모 포함)
- 경기도 공장·창고 실거래: 79,387건 (거래가·면적·계약일)
- 경기도 토지 실거래: 52,946건 (지목·면적·가격)
- 데이터 기준: 경기도 오픈API (매주 월요일 갱신)

[답변 규칙]
- 데이터 기반으로만 답변합니다. 추측·투자 추천 금지.
- 금액: 만원 단위 → 억원/만원으로 변환 (50000만원 → 5억원).
- 면적: ㎡와 평을 함께 표기 (1평 = 3.3058㎡).
- 지역별 시세 설명 시 건수·기간·평단가 범위를 명시.
- 마크다운(볼드, 리스트, 표)을 활용해 가독성 높게 작성.
- 경기도 외 지역 → "죄송합니다. 현재는 경기도 데이터만 제공합니다."
- 주거용 부동산 질문 → "저는 산업용 부동산 전문입니다."`;

// ─── 스트림 헬퍼 ────────────────────────────────────────────────────────────

function makeCookieHeader(usage: UsageRecord): string {
  return `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(usage))}; Path=/; Max-Age=86400; SameSite=Strict`;
}

function makeDeclineStream(message: string, remaining: number, cookieHeader: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: message, remaining })}\n\n`));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Set-Cookie": cookieHeader,
    },
  });
}

// ─── POST Handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 쿠키에서 사용량 읽기
  const rawCookie = req.cookies.get(COOKIE_NAME)?.value;
  const usage = parseUsage(rawCookie);

  // Rate limit 체크
  if (usage.count >= FREE_DAILY_LIMIT) {
    return NextResponse.json(
      { error: "rate_limit", message: "오늘 무료 이용(5회)을 모두 사용했습니다.", resetAt: "내일 00:00 KST", upgradeUrl: "/pricing" },
      { status: 429 }
    );
  }

  // 사용량 증가
  const newUsage: UsageRecord = { count: usage.count + 1, date: usage.date };
  const remaining = FREE_DAILY_LIMIT - newUsage.count;
  const cookieHeader = makeCookieHeader(newUsage);

  // 요청 파싱
  const body = await req.json() as { message?: string; messages?: Array<{ role: string; content: string }> };
  const { message, messages = [] } = body;

  if (!message || typeof message !== "string" || message.length > 1000) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  // 도메인 필터
  const domainResult = checkDomain(message);
  if (!domainResult.valid) {
    return makeDeclineStream(domainResult.message, remaining, cookieHeader);
  }

  // API 키 없음 → 목업 스트림
  if (!GEMINI_KEY) {
    const encoder = new TextEncoder();
    const mock = `**실거래마스터 AI** (데모 모드)\n\nGemini API 키가 설정되지 않았습니다.\n\n**설정 방법:**\n1. [Google AI Studio](https://aistudio.google.com/apikey) 접속\n2. API 키 생성\n3. \`.env.local\`의 \`GEMINI_API_KEY\`에 입력\n\n그 전까지는 지도에서 실거래 데이터를 직접 확인해 보세요!`;
    const stream = new ReadableStream({
      start(controller) {
        const chunks = mock.split("");
        let i = 0;
        const timer = setInterval(() => {
          if (i < chunks.length) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunks[i], ...(i === 0 ? { remaining } : {}) })}\n\n`));
            i++;
          } else {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            clearInterval(timer);
          }
        }, 10);
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Set-Cookie": cookieHeader },
    });
  }

  // Gemini 대화 히스토리
  const history = messages.slice(-8).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const geminiBody = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [...history, { role: "user", parts: [{ text: message }] }],
    generationConfig: { maxOutputTokens: 1500, temperature: 0.2 },
  };

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${GEMINI_KEY}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(geminiBody) }
  );

  if (!geminiRes.ok) {
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }

  const encoder = new TextEncoder();
  const reader = geminiRes.body!.getReader();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = "";
      let isFirst = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
            const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: text, ...(isFirst ? { remaining } : {}) })}\n\n`)
              );
              isFirst = false;
            }
          } catch {
            // 파싱 실패 무시
          }
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Set-Cookie": cookieHeader,
    },
  });
}
