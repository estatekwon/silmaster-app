import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "실거래마스터 — 경기도 산업용 부동산 인텔리전스",
  description: "경기도 공장·창고·토지 실거래가 지도 플랫폼",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
