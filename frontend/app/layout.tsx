import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "X Analyzer — تحليل التغريدات بالذكاء الاصطناعي",
  description: "حلل تغريداتك واكتشف أنماطاً خفية بالذكاء الاصطناعي",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
