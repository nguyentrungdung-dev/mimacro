"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="error-page">
      <h1>Chưa mở được trang</h1>
      <p>Dữ liệu đã lưu vẫn được giữ. Vui lòng thử tải lại.</p>
      <button onClick={reset}>Thử lại</button>
    </main>
  );
}
