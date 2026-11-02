import type { Metadata } from "next";
import "@fontsource-variable/geist";
import "./globals.css";
export const metadata: Metadata = {
  title: "Ôn MiMacro — Luyện tập và thi thử kinh tế học",
  description:
    "Ngân hàng câu hỏi kinh tế vi mô và vĩ mô. Luyện tập, tạo đề theo chương và thi thử.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
