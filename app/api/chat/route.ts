import { NextRequest, NextResponse } from "next/server";

const GEMINI_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `당신은 경기도 산업용 부동산 전문 AI 어시스턴트 "실거래마스터 AI"입니다.

[역할]
경기도 공장, 창고, 토지의 실거래가 데이터를 기반으로 정확한 시세 정보를 제공합니다.
투자 분석, 지역 비교, 업종별 시세 트렌드를 안내합니다.

[답변 규칙]
- 경기도 산업용 부동산 관련 질문에만 답변합니다.
- 만원 단위 금액은 "억원" 또는 "만원"으로 읽기 쉽게 변환하세요.
- 면적은 ㎡와 평을 함께 표기하세요 (1평 = 3.3058㎡).
- 경기도 외 지역 → "죄송합니다. 현재는 경기도 데이터만 제공합니다."
- 주택/아파트 질문 → "저는 산업용 부동산(공장/창고/토지) 전문입니다."
- 데이터 기반으로만 답변하고, 투자 추천은 하지 않습니다.

[현재 데이터]
- 경기도 공장등록현황: 78,552건 (WGS84 좌표 포함)
- 경기도 공장·창고 실거래: 79,387건
- 경기도 토지 실거래: 52,946건
- 데이터 기준: 경기도 오픈API (매주 월요일 갱신)`;

export async function POST(req: NextRequest) {
  const { message, messages = [] } = await req.json();

  if (!GEMINI_KEY) {
    // Mock streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const mockResponse = `안녕하세요! 실거래마스터 AI입니다.\n\nGemini API 키가 설정되지 않았습니다.\n\n**설정 방법:**\n1. https://aistudio.google.com/apikey 접속\n2. API 키 생성\n3. \`.env.local\`의 \`GEMINI_API_KEY\`에 입력\n\n그 전까지는 지도에서 실거래 데이터를 직접 확인해 보세요!`;
        const chunks = mockResponse.split("");
        let i = 0;
        const timer = setInterval(() => {
          if (i < chunks.length) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunks[i] })}\n\n`));
            i++;
          } else {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            clearInterval(timer);
          }
        }, 12);
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  }

  // Build Gemini conversation history
  const history = messages.slice(-8).map((m: { role: string; content: string }) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [
      ...history,
      { role: "user", parts: [{ text: message }] },
    ],
    generationConfig: {
      maxOutputTokens: 1024,
      temperature: 0.4,
    },
  };

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!geminiRes.ok) {
    const err = await geminiRes.text();
    console.error("[Gemini]", err);
    return NextResponse.json({ error: "Gemini API error" }, { status: 500 });
  }

  const encoder = new TextEncoder();
  const reader = geminiRes.body!.getReader();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = "";
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
            const parsed = JSON.parse(data);
            const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`)
              );
            }
          } catch {}
        }
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
}
