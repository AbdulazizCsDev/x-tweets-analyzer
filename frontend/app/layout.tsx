import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "بين السطور — اكتشف ما لا تراه في تغريداتك",
  description: "حلل آلاف التغريدات بالذكاء الاصطناعي واستخرج رؤى تجارية قابلة للتطبيق الفوري. مدعوم بـ Claude AI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
