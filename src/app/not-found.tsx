import Link from "next/link";
export default function NotFound() {
  return (
    <main className="error-page">
      <h1>Không tìm thấy trang</h1>
      <Link href="/">Về kho đề</Link>
    </main>
  );
}
