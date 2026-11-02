"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdminBank } from "./admin-bank";
import type { UserView, Question } from "@/lib/types";
import { safeBankHtml } from "@/lib/question-checks";
type Entry = Record<string, any>;
const nav = [
  ["", "Tổng quan"],
  ["nguon", "Nguồn & nhập bank"],
  ["cho-duyet", "Câu chờ duyệt"],
  ["ngan-hang", "Ngân hàng câu hỏi"],
  ["de", "Quản lý đề"],
  ["nguoi-dung", "Người dùng"],
  ["tac-vu", "Tác vụ & chi phí"],
  ["thanh-toan", "Thanh toán"],
  ["phan-hoi", "Lỗi & phản hồi"],
  ["nhat-ky", "Lịch sử thao tác"],
];
const apiAreas: Record<string, string> = {
  "": "overview",
  nguon: "sources",
  de: "exams",
  "nguoi-dung": "users",
  "tac-vu": "operations",
  "thanh-toan": "billing",
  "phan-hoi": "reports",
  "nhat-ky": "activity",
};
const names: Record<string, string> = {
  queued: "Đang chờ",
  processing: "Đang xử lý",
  needs_review: "Chờ duyệt",
  failed: "Cần xử lý",
  ready: "Đã xử lý",
  validated: "Đủ điều kiện",
  retired: "Ngừng dùng",
  draft: "Bản nháp",
  published: "Đã phát hành",
  open: "Đang mở",
  reviewing: "Đang xem xét",
  resolved: "Đã xử lý",
};
const stamp = (v: string) =>
  new Date(v).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
async function request(path: string, body?: unknown) {
  const r = await fetch("/api/" + path, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const d = await r.json();
  if (!r.ok) throw Error(d.error || "Không thực hiện được yêu cầu.");
  return d;
}
function Status({ value }: { value: string }) {
  return (
    <span className={"bank-status " + value}>{names[value] || value}</span>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="admin-empty">{children}</p>;
}
export function AdminWorkspace({
  user,
  path,
}: {
  user: UserView | null;
  path: string;
}) {
  const area = path.split("/")[2] || "";
  const [data, setData] = useState<Entry | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [search, setSearch] = useState(""),
    [loadedArea, setLoadedArea] = useState<string | null>(null),
    [navOpen, setNavOpen] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(min-width:1101px)");
    const update = () => setNavOpen(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (window.innerWidth <= 1100) setNavOpen(false);
  }, [area]);
  const sequence = useRef(0);
  const bankArea = ["ngan-hang", "cho-duyet"].includes(area);
  const load = useCallback(async () => {
    if (user?.role !== "admin" || bankArea) return;
    const seq = ++sequence.current;
    setBusy(true);
    setError("");
    try {
      const result = await request(
        "admin/" +
          (apiAreas[area] || "overview") +
          "?" +
          new URLSearchParams({ search }),
      );
      if (seq === sequence.current) {
        setData(result);
        setLoadedArea(area);
      }
    } catch (e) {
      if (seq === sequence.current) setError((e as Error).message);
    } finally {
      if (seq === sequence.current) setBusy(false);
    }
  }, [area, bankArea, user?.role, search]);
  useEffect(() => {
    setNotice("");
    void load();
  }, [load]);
  async function action(path: string, body: unknown) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await request(path, body);
      setNotice("Đã lưu thay đổi.");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (user?.role !== "admin")
    return (
      <section className="panel">
        <h1>Khu quản trị</h1>
        <p>Chỉ tài khoản quản trị được truy cập.</p>
        <Link className="button secondary" href="/tai-khoan">
          Đăng nhập
        </Link>
      </section>
    );
  return (
    <div className="admin-workspace">
      <aside className="admin-sidebar">
        <details
          className="admin-menu"
          open={navOpen}
          onToggle={(e) => setNavOpen(e.currentTarget.open)}
        >
          <summary>Điều hướng quản trị</summary>
          <nav aria-label="Quản trị Ôn MiMacro">
            {nav.map(([key, label]) => (
              <Link
                href={"/quan-tri" + (key ? "/" + key : "")}
                key={key}
                aria-current={key === area ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>
        </details>
        <p className="field-help">Ôn MiMacro · Quản trị nội dung và vận hành</p>
      </aside>
      <div className="admin-canvas">
        {bankArea ? (
          <AdminBank
            key={area}
            user={user}
            id={area === "ngan-hang" ? path.split("/")[3] : undefined}
            initialStatus={area === "cho-duyet" ? "needs_review" : ""}
          />
        ) : (
          <>
            <div className="page-title">
              <div>
                <h1>
                  {nav.find((n) => n[0] === area)?.[1] || "Tổng quan quản trị"}
                </h1>
                <p>
                  {area === "nguon"
                    ? "Nhập DOCX có đáp án và lời giải; giữ nguyên file nguồn."
                    : area === "de"
                      ? "Tạo bản đề để xem trước và phát hành cho người học."
                      : area === "nguoi-dung"
                        ? "Quyền truy cập được xác nhận ở máy chủ."
                        : "Ôn MiMacro · Dữ liệu từ hệ thống hiện tại"}
                </p>
              </div>
              <button className="secondary" disabled={busy} onClick={load}>
                Tải lại
              </button>
            </div>
            {error && (
              <div className="notice" role="alert">
                <span>{error}</span>
                <button className="text-button" onClick={load}>
                  Thử lại
                </button>
              </div>
            )}
            {notice && (
              <p role="status" className="admin-notice">
                {notice}
              </p>
            )}
            {!data || loadedArea !== area ? (
              <section className="panel" role="status">
                <h2>{error ? "Chưa tải được dữ liệu" : "Đang tải dữ liệu"}</h2>
                {!error && <div className="skeleton" />}
              </section>
            ) : (
              <>
                {area === "" && (
                  <>
                    <div className="admin-counts">
                      {[
                        ["pending", "Câu chờ duyệt", "cho-duyet"],
                        ["issues", "Vấn đề nguồn", "phan-hoi"],
                        ["imports", "Phiên nhập cần theo dõi", "nguon"],
                        ["reports", "Phản hồi mới", "phan-hoi"],
                      ].map(([k, l, url]) => (
                        <Link key={k} href={"/quan-tri/" + url}>
                          <span>{l}</span>
                          <strong className="num">
                            {data.counts[k].toLocaleString("vi-VN")}
                          </strong>
                        </Link>
                      ))}
                    </div>
                    <section className="panel">
                      <h2>Ngân hàng và người học</h2>
                      <p>
                        {data.counts.questions.toLocaleString("vi-VN")} câu ·{" "}
                        {data.counts.sources} nguồn · {data.counts.students}{" "}
                        người học · {data.counts.exams} đề đã phát hành
                      </p>
                      <div className="button-row">
                        <Link href="/quan-tri/nguon" className="button">
                          Nhập bank DOCX
                        </Link>
                        <Link
                          href="/quan-tri/cho-duyet"
                          className="button secondary"
                        >
                          Xử lý câu chờ duyệt
                        </Link>
                      </div>
                    </section>
                    <section className="panel">
                      <h2>Phiên nhập gần đây</h2>
                      <Uploads rows={data.recent} busy={busy} action={action} />
                    </section>
                  </>
                )}
                {area === "nguon" && (
                  <>
                    <UploadForm
                      busy={busy}
                      onDone={async (message) => {
                        setNotice(message);
                        await load();
                      }}
                      onError={setError}
                    />
                    <section className="panel">
                      <h2>Phiên nhập và file nguồn riêng tư</h2>
                      <Uploads
                        rows={data.uploads}
                        busy={busy}
                        action={action}
                      />
                    </section>
                    <section className="panel">
                      <h2>Nguồn trong ngân hàng</h2>
                      <div className="admin-search">
                        <label className="field">
                          Tìm nguồn
                          <input
                            value={search}
                            maxLength={160}
                            onChange={(e) => setSearch(e.target.value)}
                          />
                        </label>
                      </div>
                      {data.sources.length ? (
                        data.sources.map((s: Entry) => (
                          <div className="admin-data-row" key={s.id}>
                            <div>
                              <strong>{s.title}</strong>
                              <small>
                                {s.subject === "micro" ? "Vi mô" : "Vĩ mô"} ·{" "}
                                {s.language === "en"
                                  ? "Tiếng Anh"
                                  : "Tiếng Việt"}{" "}
                                · Chương {s.chapter}
                              </small>
                            </div>
                            <span className="num">
                              {s.question_count} câu · {s.pending} chờ duyệt
                            </span>
                            <Link
                              href={
                                "/quan-tri/ngan-hang?source=" +
                                encodeURIComponent(s.id)
                              }
                            >
                              Xem câu →
                            </Link>
                          </div>
                        ))
                      ) : (
                        <Empty>Chưa có nguồn phù hợp.</Empty>
                      )}
                    </section>
                  </>
                )}
                {area === "nguoi-dung" && (
                  <section className="panel">
                    <div className="panel-header">
                      <h2>Tài khoản</h2>
                      <span className="muted">Tối đa 100 kết quả</span>
                    </div>
                    <label className="field">
                      Tìm tên đăng nhập / tên hiển thị
                      <input
                        maxLength={160}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </label>
                    {data.rows.length ? (
                      data.rows.map((u: Entry) => (
                        <UserRow
                          key={u.id}
                          row={u}
                          self={u.id === user.id}
                          busy={busy}
                          action={action}
                        />
                      ))
                    ) : (
                      <Empty>Chưa có tài khoản phù hợp.</Empty>
                    )}
                  </section>
                )}
                {area === "de" && (
                  <ExamManager
                    data={data}
                    busy={busy}
                    action={action}
                    onError={setError}
                  />
                )}
                {area === "tac-vu" && (
                  <>
                    <section className="panel">
                      <h2>AI và hạn mức vận hành</h2>
                      <p>{data.ai.message}</p>
                      <p className="field-help">
                        Khóa OpenRouter:{" "}
                        {data.ai.keyConfigured
                          ? "đã có cấu hình, gateway chưa kết nối"
                          : "chưa cấu hình"}
                        . Không có lời gọi model từ màn hình này.
                      </p>
                    </section>
                    <section className="panel">
                      <h2>Tác vụ nhập liệu</h2>
                      <Uploads rows={data.jobs} busy={busy} action={action} />
                    </section>
                    <section className="panel">
                      <h2>Chi phí AI đã ghi nhận</h2>
                      {data.usage.length ? (
                        data.usage.map((u: Entry) => (
                          <div
                            className="admin-data-row"
                            key={u.task + u.model}
                          >
                            <div>
                              <strong>{u.task}</strong>
                              <small>
                                {u.model} · {u.calls} lượt gọi ·{" "}
                                {u.input_tokens}/{u.output_tokens} tokens vào/ra
                              </small>
                            </div>
                            <span className="num">
                              {Number(u.cost_usd).toFixed(6)} USD
                            </span>
                          </div>
                        ))
                      ) : (
                        <Empty>
                          Chưa có usage AI được ghi nhận. Không ước đoán chi phí
                          hoặc độ chính xác.
                        </Empty>
                      )}
                    </section>
                  </>
                )}
                {area === "thanh-toan" && (
                  <section className="panel">
                    <h2>Gói và đối soát SePay</h2>
                    <p>{data.message}</p>
                    <p>
                      Giá đã thống nhất:{" "}
                      <strong className="num">
                        {data.priceVnd.toLocaleString("vi-VN")} đồng/tháng
                      </strong>
                      .
                    </p>
                    <h3>Thông tin còn cần chốt</h3>
                    <ul>
                      {data.openQuestions.map((q: string) => (
                        <li key={q}>{q}</li>
                      ))}
                    </ul>
                    <p className="field-help">
                      Không có giao dịch giả, nút xác nhận chuyển tiền hoặc cấp
                      gói khi chưa có giao dịch xác thực.
                    </p>
                  </section>
                )}
                {area === "phan-hoi" && (
                  <>
                    <section className="panel">
                      <h2>Vấn đề từ nguồn / kiểm tra nội dung</h2>
                      {data.issues.length ? (
                        data.issues.map((i: Entry) => (
                          <div className="admin-data-row" key={i.id}>
                            <div>
                              <strong>
                                {i.kind === "source_explanation_arithmetic"
                                  ? "Lời giải nguồn không nhất quán"
                                  : i.kind}
                              </strong>
                              <p>{i.detail}</p>
                            </div>
                            {i.question_id && (
                              <Link
                                href={"/quan-tri/ngan-hang/" + i.question_id}
                              >
                                Đối chiếu và duyệt →
                              </Link>
                            )}
                          </div>
                        ))
                      ) : (
                        <Empty>Không có vấn đề nguồn đang mở.</Empty>
                      )}
                    </section>
                    <section className="panel">
                      <h2>Phản hồi người học</h2>
                      {data.rows.length ? (
                        data.rows.map((r: Entry) => (
                          <ReportRow
                            key={r.id}
                            row={r}
                            busy={busy}
                            action={action}
                          />
                        ))
                      ) : (
                        <Empty>
                          Chưa có phản hồi. Người học có thể báo lỗi từ từng câu
                          trong bài làm.
                        </Empty>
                      )}
                      <p className="field-help">
                        Xử lý phản hồi không tự thay điểm lịch sử. Chấm lại tự
                        luận/đồ thị cần rubric và hệ thống chấm chưa kết nối.
                      </p>
                    </section>
                  </>
                )}
                {area === "nhat-ky" && (
                  <section className="panel">
                    <h2>Thao tác quản trị gần nhất</h2>
                    {data.rows.length ? (
                      data.rows.map((r: Entry) => (
                        <details key={r.id} className="bank-revision">
                          <summary>
                            {r.actor} · {r.action}
                            <small>{stamp(r.created_at)}</small>
                          </summary>
                          <p className="field-help">Đối tượng: {r.entity_id}</p>
                          <pre className="admin-json">
                            {JSON.stringify(r.detail, null, 2)}
                          </pre>
                        </details>
                      ))
                    ) : (
                      <Empty>
                        Chưa có thao tác được ghi nhận ở khu quản trị mới.
                      </Empty>
                    )}
                  </section>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
function Uploads({
  rows,
  busy,
  action,
}: {
  rows: Entry[];
  busy: boolean;
  action: (path: string, b: unknown) => Promise<void>;
}) {
  return rows.length ? (
    <div>
      {rows.map((r) => (
        <details className="bank-revision" key={r.id}>
          <summary>
            <strong>{r.filename}</strong> <Status value={r.status} />
            <small>{stamp(r.created_at)}</small>
          </summary>
          <p>
            {r.report?.message ||
              "Tác vụ đã được ghi nhận; tải lại để cập nhật."}
          </p>
          {r.report?.questions !== undefined && (
            <p>
              {r.report.questions} câu · {r.report.issues} vấn đề ·{" "}
              {r.report.media} hình
            </p>
          )}
          <div className="button-row">
            <a
              className="button secondary"
              href={"/api/admin/uploads/" + r.id + "/file"}
            >
              Xem file nguồn
            </a>
            {(r.status === "failed" || r.status === "processing") && (
              <button
                className="secondary"
                disabled={busy}
                onClick={() => action("admin/uploads/" + r.id + "/retry", {})}
              >
                Thử xử lý lại
              </button>
            )}
            {r.source_id && (
              <Link
                className="button secondary"
                href={"/quan-tri/ngan-hang?source=" + r.source_id}
              >
                Mở câu đã nhập
              </Link>
            )}
          </div>
        </details>
      ))}
    </div>
  ) : (
    <Empty>
      Chưa có phiên nhập qua giao diện. Các nguồn ban đầu được nhập bằng công cụ
      dữ liệu.
    </Empty>
  );
}
function UploadForm({
  busy,
  onDone,
  onError,
}: {
  busy: boolean;
  onDone: (s: string) => Promise<void>;
  onError: (s: string) => void;
}) {
  const [sending, setSending] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const f = data.get("file") as File;
    if (f.size > 25 * 1024 * 1024) {
      onError("File vượt giới hạn 25 MB.");
      return;
    }
    setSending(true);
    onError("");
    try {
      const r = await fetch("/api/admin/uploads", {
        method: "POST",
        body: data,
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      await onDone(
        d.duplicate
          ? "File đã được nhận trước đó; xem phiên nhập hiện có."
          : "Đã lưu file và kết quả xử lý. Mở phiên nhập bên dưới để xem báo cáo và duyệt câu.",
      );
      form.reset();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setSending(false);
    }
  }
  return (
    <form className="panel admin-upload" onSubmit={submit}>
      <h2>Đăng tải bank câu hỏi</h2>
      <p className="field-help">
        DOCX tối đa 25 MB, định dạng trắc nghiệm Frank như mẫu đã gửi, có Answer
        Key và lời giải. Giữ bảng/ảnh/sup/sub; định dạng khác được giữ file và
        báo cần xử lý, không tự đoán đáp án.
      </p>
      <fieldset disabled={busy || sending} className="admin-form-grid">
        <label className="field">
          Tên nguồn
          <input name="title" required minLength={3} maxLength={160} />
        </label>
        <label className="field">
          Chủ đề
          <input name="topic" required minLength={3} maxLength={200} />
        </label>
        <label className="field">
          Môn
          <select name="subject">
            <option value="micro">Vi mô</option>
            <option value="macro">Vĩ mô</option>
          </select>
        </label>
        <label className="field">
          Ngôn ngữ
          <select name="language">
            <option value="en">Tiếng Anh</option>
            <option value="vi">Tiếng Việt</option>
          </select>
        </label>
        <label className="field">
          Chương
          <input
            name="chapter"
            type="number"
            min={1}
            max={100}
            defaultValue={1}
            required
          />
        </label>
        <label className="field">
          File DOCX
          <input
            name="file"
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            required
          />
        </label>
      </fieldset>
      <button disabled={busy || sending} type="submit">
        {sending ? "Đang lưu và đọc DOCX…" : "Tải lên và kiểm tra cấu trúc"}
      </button>
      <p aria-live="polite" className="field-help">
        {sending
          ? "File đang được lưu riêng tư, không đóng trang cho tới khi có kết quả."
          : "Câu mới nhập chưa đưa vào đề cho tới khi được admin duyệt."}
      </p>
    </form>
  );
}
function UserRow({
  row: u,
  self,
  busy,
  action,
}: {
  row: Entry;
  self: boolean;
  busy: boolean;
  action: (p: string, b: unknown) => Promise<void>;
}) {
  const [role, setRole] = useState(u.role),
    [active, setActive] = useState(u.is_active),
    [reason, setReason] = useState("");
  return (
    <details className="bank-revision">
      <summary>
        <strong>
          {u.display_name} · @{u.username}
        </strong>{" "}
        <span>
          {u.role === "admin" ? "Quản trị" : "Người học"} ·{" "}
          {u.is_active ? "Hoạt động" : "Đã khóa"} · {u.attempts} lượt làm
        </span>
      </summary>
      <div className="admin-form-grid">
        <label className="field">
          Vai trò
          <select
            value={role}
            disabled={self}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="student">Người học</option>
            <option value="admin">Quản trị</option>
          </select>
        </label>
        <label className="field">
          Truy cập
          <select
            value={String(active)}
            disabled={self}
            onChange={(e) => setActive(e.target.value === "true")}
          >
            <option value="true">Hoạt động</option>
            <option value="false">Khóa tài khoản</option>
          </select>
        </label>
      </div>
      <label className="field">
        Lý do thay đổi
        <input
          value={reason}
          minLength={8}
          maxLength={1000}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      <button
        className="secondary"
        disabled={
          self ||
          busy ||
          reason.trim().length < 8 ||
          (role === u.role && active === u.is_active)
        }
        onClick={() =>
          action("admin/users/" + u.id, { role, isActive: active, reason })
        }
      >
        Lưu quyền truy cập
      </button>
      <p className="field-help">
        {self
          ? "Không tự khóa/thu hồi quyền của tài khoản đang dùng."
          : "Đổi vai trò hoặc khóa sẽ thu hồi phiên hiện có; không xóa lịch sử học."}
      </p>
    </details>
  );
}
function ReportRow({
  row: r,
  busy,
  action,
}: {
  row: Entry;
  busy: boolean;
  action: (p: string, b: unknown) => Promise<void>;
}) {
  const [note, setNote] = useState(r.resolution || "");
  return (
    <details className="bank-revision">
      <summary>
        {r.username || "Phiên khách"} · <Status value={r.status} />
        <small>{stamp(r.created_at)}</small>
      </summary>
      <p>{r.detail}</p>
      <Link href={"/quan-tri/ngan-hang/" + r.question_id}>
        Mở câu cần đối chiếu →
      </Link>
      <label className="field">
        Kết quả xử lý
        <textarea
          value={note}
          minLength={8}
          maxLength={2000}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <div className="button-row">
        <button
          className="secondary"
          disabled={busy || note.trim().length < 8}
          onClick={() =>
            action("admin/reports/" + r.id, {
              status: "reviewing",
              resolution: note,
            })
          }
        >
          Đang xem xét
        </button>
        <button
          disabled={busy || note.trim().length < 8}
          onClick={() =>
            action("admin/reports/" + r.id, {
              status: "resolved",
              resolution: note,
            })
          }
        >
          Đánh dấu đã xử lý
        </button>
      </div>
    </details>
  );
}
function ExamManager({
  data,
  busy,
  action,
  onError,
}: {
  data: Entry;
  busy: boolean;
  action: (p: string, b: unknown) => Promise<void>;
  onError: (s: string) => void;
}) {
  const [sourceIds, setSources] = useState<string[]>([]),
    [preview, setPreview] = useState<Entry | null>(null),
    [loading, setLoading] = useState(false),
    [notes, setNotes] = useState<Record<string, string>>({});
  async function open(id: string) {
    setLoading(true);
    try {
      setPreview(await request("admin/exams/" + id));
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await action("admin/exams", {
      title: f.get("title"),
      sourceIds,
      count: Number(f.get("count")),
      minutes: Number(f.get("minutes")),
      freeCandidate: f.get("free") === "on",
    });
  }
  return (
    <>
      <form className="panel" onSubmit={create}>
        <h2>Tạo bản đề từ kho đã duyệt</h2>
        <div className="admin-form-grid">
          <label className="field">
            Tên đề
            <input name="title" minLength={3} maxLength={160} required />
          </label>
          <label className="field">
            Số câu
            <input
              name="count"
              type="number"
              defaultValue={20}
              min={1}
              max={250}
              required
            />
          </label>
          <label className="field">
            Thời lượng (phút)
            <input
              name="minutes"
              type="number"
              defaultValue={30}
              min={1}
              max={600}
              required
            />
          </label>
        </div>
        <fieldset className="admin-source-picker">
          <legend>Chọn chương cùng môn/ngôn ngữ</legend>
          {data.sources.map((s: Entry) => (
            <label className="bank-checkbox" key={s.id}>
              <input
                type="checkbox"
                checked={sourceIds.includes(s.id)}
                onChange={(e) =>
                  setSources((v) =>
                    e.target.checked
                      ? [...v, s.id]
                      : v.filter((id) => id !== s.id),
                  )
                }
              />
              {s.title} · {s.available} câu
            </label>
          ))}
        </fieldset>
        <label className="bank-checkbox">
          <input name="free" type="checkbox" />
          Đánh dấu ứng viên cho bộ năm đề miễn phí
        </label>
        <p className="field-help">
          Phân bổ hiện chia đều chương. Chính sách lượt khách chưa cấu hình;
          đánh dấu ứng viên không tự kích hoạt hạn mức hoặc quyền trả phí.
        </p>
        <button disabled={busy || !sourceIds.length} type="submit">
          Tạo bản nháp để xem trước
        </button>
      </form>
      <section className="panel">
        <h2>Đề đã tạo</h2>
        {data.rows.length ? (
          data.rows.map((r: Entry) => (
            <details className="bank-revision" key={r.id}>
              <summary>
                <strong>{r.title}</strong> <Status value={r.status} />
                <span>
                  {r.questions} câu · {r.minutes} phút · v{r.version}
                  {r.free_candidate ? " · Ứng viên miễn phí" : ""}
                </span>
              </summary>
              <label className="field">
                Lý do thay đổi trạng thái
                <input
                  minLength={8}
                  maxLength={1000}
                  value={notes[r.id] || ""}
                  onChange={(e) =>
                    setNotes((n) => ({ ...n, [r.id]: e.target.value }))
                  }
                />
              </label>
              <div className="button-row">
                <button
                  className="secondary"
                  disabled={loading}
                  onClick={() => open(r.id)}
                >
                  Xem trước đề
                </button>
                {["published", "draft", "retired"]
                  .filter((s) => s !== r.status)
                  .map((s) => (
                    <button
                      key={s}
                      className="secondary"
                      disabled={busy || (notes[r.id] || "").trim().length < 8}
                      onClick={() =>
                        action("admin/exams/" + r.id, {
                          status: s,
                          version: r.version,
                          reason: notes[r.id],
                        })
                      }
                    >
                      {s === "published"
                        ? "Phát hành"
                        : s === "draft"
                          ? "Gỡ về nháp"
                          : "Ngừng dùng"}
                    </button>
                  ))}
              </div>
            </details>
          ))
        ) : (
          <Empty>
            Chưa có đề do quản trị tạo. Các đề nguồn vẫn nằm trong ngân hàng.
          </Empty>
        )}
      </section>
      {preview && (
        <section className="panel">
          <div className="panel-header">
            <h2>Xem trước: {preview.title}</h2>
            <button className="text-button" onClick={() => setPreview(null)}>
              Đóng xem trước
            </button>
          </div>
          <p className="field-help">
            Xem nội dung và đáp án để quản trị; không tạo lượt làm hoặc điểm.
          </p>
          {preview.snapshot.map((q: Question, i: number) => (
            <details className="bank-revision" key={q.id}>
              <summary>
                Câu {i + 1} · {q.topic}
              </summary>
              {safeBankHtml(q.html) && (
                <div
                  className="question-content"
                  dangerouslySetInnerHTML={{ __html: q.html }}
                />
              )}
              <ol>
                {q.options.map((o, j) => (
                  <li key={o.id}>
                    {String.fromCharCode(65 + j)} · {o.text}
                    {o.id === q.answer ? " — Đáp án đúng" : ""}
                  </li>
                ))}
              </ol>
              <p>{q.explanation}</p>
            </details>
          ))}
        </section>
      )}
    </>
  );
}
