"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Question, UserView } from "@/lib/types";
import {
  safeBankHtml,
  type Check,
  type QuestionEdit,
} from "@/lib/question-checks";
const labels: Record<string, string> = {
  validated: "Đủ điều kiện",
  needs_review: "Chờ kiểm tra",
  retired: "Ngừng sử dụng",
};
type Revision = {
  version: number;
  status: string;
  content: Question;
  reason: string;
  checks: Check[];
  createdAt: string;
  actorName: string | null;
};
type Detail = {
  id: string;
  version: number;
  status: string;
  content: Question;
  issues: {
    id: string;
    detail: string;
    kind: string;
    status: string;
    resolution: string | null;
    resolved_version: number | null;
  }[];
  revisions: Revision[];
};
type Listing = {
  rows: {
    id: string;
    version: number;
    status: string;
    number: number;
    text: string;
    topic: string;
    sourceTitle: string;
    sourceId: string;
    openIssues: number;
  }[];
  total: number;
  page: number;
  sources: { id: string; title: string }[];
};
async function request<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch("/api/admin/questions" + path, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw Error(data.error || "Không tải được dữ liệu.");
  return data;
}
function Html({ value }: { value: string }) {
  return safeBankHtml(value) ? (
    <div
      className="question-content"
      dangerouslySetInnerHTML={{ __html: value }}
    />
  ) : (
    <pre>{value}</pre>
  );
}
function Preview({ q }: { q: Question }) {
  return (
    <div className="bank-preview">
      <Html value={q.html} />
      <ol className="bank-options">
        {q.options.map((o, i) => (
          <li key={o.id}>
            <span>
              {String.fromCharCode(65 + i)} · ID {o.id}
            </span>
            <Html value={o.html || o.text} />
            {q.answer === o.id && <strong>Đáp án</strong>}
          </li>
        ))}
      </ol>
      <h3>Lời giải</h3>
      <Html value={q.explanationHtml} />
      <p className="field-help">
        {q.topic} · {q.sourceTitle} · Câu {q.number}
      </p>
    </div>
  );
}
export function AdminBank({
  user,
  id,
  initialStatus = "",
}: {
  user: UserView | null;
  id?: string;
  initialStatus?: string;
}) {
  const [list, setList] = useState<Listing | null>(null),
    [detail, setDetail] = useState<Detail | null>(null),
    [search, setSearch] = useState(""),
    [source, setSource] = useState(""),
    [status, setStatus] = useState(initialStatus),
    [page, setPage] = useState(1),
    [query, setQuery] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [refresh, setRefresh] = useState(0);
  useEffect(() => {
    setSource(new URLSearchParams(window.location.search).get("source") || "");
  }, []);
  const loadSequence = useRef(0);
  const load = useCallback(async () => {
    const sequence = ++loadSequence.current;
    if (user?.role !== "admin") return;
    setLoading(true);
    setError("");
    try {
      if (id) {
        const value = await request<Detail>("/" + encodeURIComponent(id));
        if (sequence === loadSequence.current) setDetail(value);
      } else {
        const value = await request<Listing>(
          "?" +
            new URLSearchParams({
              search: query,
              source,
              status,
              page: String(page),
            }),
        );
        if (sequence === loadSequence.current) setList(value);
      }
    } catch (e) {
      if (sequence === loadSequence.current) setError((e as Error).message);
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, [id, user?.role, query, source, status, page]);
  useEffect(() => {
    setDetail(null);
    void load();
  }, [load, refresh]);
  if (user?.role !== "admin")
    return (
      <section className="panel">
        <h1>Quản trị ngân hàng</h1>
        <p>Chỉ tài khoản quản trị được truy cập câu hỏi và đáp án nguồn.</p>
        <Link href="/tai-khoan" className="button secondary">
          Đăng nhập tài khoản quản trị
        </Link>
      </section>
    );
  return (
    <div className="bank-admin">
      <div className="page-title">
        <div>
          {id && (
            <Link href="/quan-tri/ngan-hang" className="back-link">
              ← Ngân hàng câu hỏi
            </Link>
          )}
          <h1>
            {id
              ? detail
                ? `Câu ${detail.content.number}`
                : "Chi tiết câu hỏi"
              : "Ngân hàng câu hỏi"}
          </h1>
          <p>
            {id
              ? detail?.content.sourceTitle
              : "Quản trị nội dung · Đối chiếu nguồn trước khi mở câu cho đề mới"}
          </p>
        </div>
        <button
          className="secondary"
          onClick={() => setRefresh((n) => n + 1)}
          disabled={loading}
        >
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
      {id ? (
        detail ? (
          <Editor
            key={`${detail.id}-${detail.version}`}
            detail={detail}
            onSaved={load}
          />
        ) : (
          !error && (
            <div className="panel" role="status">
              <h2>Nội dung câu hỏi</h2>
              <div className="skeleton" />
              <p>Đang tải phiên bản và lịch sử…</p>
            </div>
          )
        )
      ) : (
        <>
          <div className="bank-tabs" aria-label="Trạng thái câu hỏi">
            {[
              ["", "Tất cả"],
              ["needs_review", "Chờ kiểm tra"],
              ["validated", "Đủ điều kiện"],
              ["retired", "Ngừng sử dụng"],
            ].map(([v, l]) => (
              <button
                className="text-button"
                key={v}
                aria-pressed={status === v}
                onClick={() => {
                  setStatus(v);
                  setPage(1);
                }}
              >
                {l}
              </button>
            ))}
          </div>
          <form
            className="bank-filters"
            onSubmit={(e) => {
              e.preventDefault();
              setQuery(search);
              setPage(1);
            }}
          >
            <label className="field">
              Tìm câu hỏi
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                maxLength={200}
                placeholder="Nội dung, số câu hoặc ID"
              />
            </label>
            <label className="field">
              Nguồn / chương
              <select
                value={source}
                onChange={(e) => {
                  setSource(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tất cả nguồn</option>
                {list?.sources.map((s) => (
                  <option value={s.id} key={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="secondary">
              Tìm kiếm
            </button>
          </form>
          <section aria-busy={loading} aria-labelledby="bank-list-title">
            <div className="panel-header">
              <h2 id="bank-list-title">Danh sách câu hỏi</h2>
              <span className="muted num" role="status">
                {loading
                  ? "Đang tải…"
                  : `${(list?.total || 0).toLocaleString("vi-VN")} câu`}
              </span>
            </div>
            {!list && !error ? (
              <div className="skeleton" />
            ) : (
              list && (
                <>
                  <div className="bank-table">
                    <div className="bank-row bank-table-head">
                      <span>Câu hỏi / nguồn</span>
                      <span>Chủ đề</span>
                      <span>Trạng thái</span>
                      <span className="num">Phiên bản</span>
                    </div>
                    {list.rows.map((q) => (
                      <Link
                        key={q.id}
                        className="bank-row"
                        href={"/quan-tri/ngan-hang/" + encodeURIComponent(q.id)}
                      >
                        <div>
                          <strong>
                            Câu {q.number} · {q.text}
                          </strong>
                          <small>
                            {q.sourceTitle}
                            {q.openIssues ? ` · ${q.openIssues} vấn đề mở` : ""}
                          </small>
                        </div>
                        <span className="bank-topic">{q.topic}</span>
                        <span className={"bank-status " + q.status}>
                          {labels[q.status]}
                        </span>
                        <span className="num bank-version">v{q.version}</span>
                      </Link>
                    ))}
                  </div>
                  {!list.rows.length && (
                    <p className="empty-copy">
                      Không có câu hỏi phù hợp bộ lọc này.
                    </p>
                  )}
                  <div className="bank-pagination">
                    <span className="muted num">
                      {list.total
                        ? `${(page - 1) * 25 + 1}–${Math.min(page * 25, list.total)} / ${list.total.toLocaleString("vi-VN")} câu`
                        : "0 câu"}
                    </span>
                    <div className="button-row">
                      <button
                        className="secondary"
                        disabled={page === 1 || loading}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        Trang trước
                      </button>
                      <button
                        className="secondary"
                        disabled={page * 25 >= list.total || loading}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Trang sau
                      </button>
                    </div>
                  </div>
                </>
              )
            )}
          </section>
        </>
      )}
    </div>
  );
}
function Editor({
  detail: d,
  onSaved,
}: {
  detail: Detail;
  onSaved: () => Promise<void>;
}) {
  const [tab, setTab] = useState("preview"),
    [draft, setDraft] = useState<QuestionEdit>({
      expectedVersion: d.version,
      reason: "",
      html: d.content.html,
      text: d.content.text,
      options: d.content.options.map((o) => ({ ...o, html: o.html || o.text })),
      answer: d.content.answer,
      explanation: d.content.explanation,
      explanationHtml: d.content.explanationHtml,
      topic: d.content.topic,
    });
  const [reason, setReason] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [resolveIssues, setResolve] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [result, setResult] = useState<Check[] | null>(null),
    [notice, setNotice] = useState("");
  const dirty =
    JSON.stringify({ ...draft, reason: "" }) !==
    JSON.stringify({
      expectedVersion: d.version,
      reason: "",
      html: d.content.html,
      text: d.content.text,
      options: d.content.options.map((o) => ({ ...o, html: o.html || o.text })),
      answer: d.content.answer,
      explanation: d.content.explanation,
      explanationHtml: d.content.explanationHtml,
      topic: d.content.topic,
    });
  useEffect(() => {
    const fn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", fn);
    return () => window.removeEventListener("beforeunload", fn);
  }, [dirty]);
  useEffect(() => {
    const guard = (e: MouseEvent) => {
      if (!dirty) return;
      const element = e.target instanceof Element ? e.target : null;
      const anchor = element?.closest("a[href]");
      if (anchor?.getAttribute("href")?.startsWith("#")) return;
      if (anchor || element?.closest(".page-title button")) {
        if (
          !window.confirm(
            "Bản sửa chưa được lưu. Rời câu hỏi và bỏ các thay đổi này?",
          )
        ) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      }
    };
    document.addEventListener("click", guard, true);
    return () => document.removeEventListener("click", guard, true);
  }, [dirty]);
  const set = (key: keyof QuestionEdit, value: string) =>
    setDraft((p) => ({ ...p, [key]: value }));
  async function act(action: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await request<{ checks: Check[] }>(
        "/" + encodeURIComponent(d.id) + "/" + action,
        action === "save"
          ? { ...draft, reason }
          : { expectedVersion: d.version, reason, confirmed, resolveIssues },
      );
      setResult(r.checks);
      if (action === "save") await onSaved();
      else {
        setNotice("Đã ghi nhận thao tác. Tải lại để xem phiên bản mới.");
        await onSaved();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="bank-meta">
        {d.status === "needs_review" && (
          <a className="button secondary" href="#question-review">
            Đến phần duyệt ↓
          </a>
        )}
        <span className={"bank-status " + d.status}>{labels[d.status]}</span>
        <span className="muted num">Phiên bản {d.version}</span>
        <span className="muted">ID {d.id}</span>
      </div>
      <div className="bank-tabs">
        {[
          ["preview", "Nội dung"],
          ["edit", "Chỉnh sửa"],
          ["history", `Lịch sử (${d.revisions.length})`],
        ].map(([v, l]) => (
          <button
            key={v}
            className="text-button"
            aria-pressed={tab === v}
            onClick={() => setTab(v)}
          >
            {l}
            {v === "edit" && dirty ? " · Chưa lưu" : ""}
          </button>
        ))}
      </div>
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {tab === "history" ? (
        <section className="panel">
          <h2>Lịch sử phiên bản</h2>
          <p className="field-help">
            Mở từng phiên bản để đối chiếu toàn bộ nội dung đã lưu.
          </p>
          {d.revisions.map((r, i) => (
            <details className="bank-revision" key={r.version}>
              <summary>
                <strong>
                  v{r.version} · {labels[r.status]}
                </strong>
                <span>
                  {r.actorName || "Nhập ngân hàng"} ·{" "}
                  {new Date(r.createdAt).toLocaleString("vi-VN", {
                    timeZone: "Asia/Ho_Chi_Minh",
                  })}
                </span>
              </summary>
              <p className="bank-reason">{r.reason}</p>
              {i < d.revisions.length - 1 && (
                <p className="field-help">
                  Trường thay đổi:{" "}
                  {[
                    "html",
                    "text",
                    "options",
                    "answer",
                    "explanation",
                    "explanationHtml",
                    "topic",
                  ]
                    .filter(
                      (k) =>
                        JSON.stringify(r.content[k as keyof Question]) !==
                        JSON.stringify(
                          d.revisions[i + 1].content[k as keyof Question],
                        ),
                    )
                    .join(", ") || "Chỉ trạng thái / ghi nhận kiểm tra"}
                </p>
              )}
              {r.version === 1 ? (
                <p className="field-help">
                  Bản nhập ban đầu; chưa có báo cáo kiểm tra từ quản trị.
                </p>
              ) : (
                <CheckResults checks={r.checks} />
              )}
              <Preview q={r.content} />
            </details>
          ))}
        </section>
      ) : (
        <div className="bank-detail-layout">
          <section className="panel">
            {tab === "preview" ? (
              <>
                <h2>Câu hỏi và lời giải</h2>
                <Preview q={d.content} />
              </>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void act("save");
                }}
              >
                <h2>Sửa phiên bản {d.version}</h2>
                <p className="field-help">
                  Giữ nguyên ID lựa chọn. HTML hỗ trợ p, strong, em, sup/sub,
                  bảng và hình nguồn. Bản sửa sẽ chờ kiểm tra.
                </p>
                <label className="field">
                  Nội dung để tìm kiếm
                  <textarea
                    value={draft.text}
                    maxLength={15000}
                    onChange={(e) => set("text", e.target.value)}
                  />
                </label>
                <label className="field">
                  Nội dung hiển thị (HTML)
                  <textarea
                    className="bank-code"
                    value={draft.html}
                    maxLength={20000}
                    onChange={(e) => set("html", e.target.value)}
                  />
                </label>
                {draft.options.map((o, i) => (
                  <fieldset className="bank-option-edit" key={o.id}>
                    <legend>
                      Lựa chọn {String.fromCharCode(65 + i)} · ID {o.id}
                    </legend>
                    <label className="field">
                      Văn bản
                      <input
                        value={o.text}
                        maxLength={6000}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            options: p.options.map((x, n) =>
                              n === i ? { ...x, text: e.target.value } : x,
                            ),
                          }))
                        }
                      />
                    </label>
                    <label className="field">
                      Hiển thị (HTML)
                      <textarea
                        value={o.html}
                        maxLength={10000}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            options: p.options.map((x, n) =>
                              n === i ? { ...x, html: e.target.value } : x,
                            ),
                          }))
                        }
                      />
                    </label>
                  </fieldset>
                ))}
                <label className="field">
                  Đáp án theo ID
                  <select
                    value={draft.answer}
                    onChange={(e) => set("answer", e.target.value)}
                  >
                    {draft.options.map((o, i) => (
                      <option key={o.id} value={o.id}>
                        {String.fromCharCode(65 + i)} · ID {o.id}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Chủ đề
                  <input
                    value={draft.topic}
                    maxLength={200}
                    onChange={(e) => set("topic", e.target.value)}
                  />
                </label>
                <label className="field">
                  Lời giải dạng văn bản
                  <textarea
                    value={draft.explanation}
                    maxLength={15000}
                    onChange={(e) => set("explanation", e.target.value)}
                  />
                </label>
                <label className="field">
                  Lời giải hiển thị (HTML)
                  <textarea
                    className="bank-code"
                    value={draft.explanationHtml}
                    maxLength={20000}
                    onChange={(e) => set("explanationHtml", e.target.value)}
                  />
                </label>
                <p className="field-help">
                  Ghi lý do thay đổi trong mục Kiểm tra và phát hành.
                </p>
                <button
                  type="submit"
                  disabled={busy || !dirty || reason.trim().length < 8}
                >
                  Lưu phiên bản mới
                </button>
                <details className="bank-revision">
                  <summary>Xem trước bản sửa chưa lưu</summary>
                  <Preview q={{ ...d.content, ...draft }} />
                </details>
              </form>
            )}
          </section>
          <aside className="bank-review">
            <section className="panel">
              <h2>Vấn đề nội dung</h2>
              {d.issues.length ? (
                d.issues.map((i) => (
                  <div key={i.id} className="bank-issue">
                    <strong>
                      {i.status === "open" ? "Đang mở" : "Đã xử lý"}
                    </strong>
                    <p>{i.detail}</p>
                    {i.resolution && (
                      <p>
                        v{i.resolved_version}: {i.resolution}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="field-help">Chưa ghi nhận vấn đề từ lần nhập.</p>
              )}
            </section>
            <section className="panel">
              <h2 id="question-review">Kiểm tra và phát hành</h2>
              <p className="field-help">
                Kiểm tra cấu trúc bằng code; chưa thay thế nghiệm thu học thuật.
                Thao tác áp dụng cho bản đã lưu.
              </p>
              <label className="field">
                Lý do / cách xử lý
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  minLength={8}
                  maxLength={2000}
                  placeholder="Ít nhất 8 ký tự; nêu căn cứ đối chiếu"
                />
              </label>
              <label className="bank-checkbox">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                Đã đối chiếu câu, đáp án, lời giải và hình với nguồn
              </label>
              {d.issues.some((i) => i.status === "open") && (
                <label className="bank-checkbox">
                  <input
                    type="checkbox"
                    checked={resolveIssues}
                    onChange={(e) => setResolve(e.target.checked)}
                  />
                  Xác nhận đã xử lý các vấn đề mở theo ghi chú
                </label>
              )}
              <div className="bank-actions">
                <button
                  className="secondary"
                  disabled={busy || dirty || reason.trim().length < 8}
                  onClick={() => void act("check")}
                >
                  Kiểm tra lại cấu trúc
                </button>
                <button
                  disabled={
                    busy ||
                    dirty ||
                    !confirmed ||
                    reason.trim().length < 8 ||
                    (d.issues.some((i) => i.status === "open") &&
                      !resolveIssues)
                  }
                  onClick={() => void act("validate")}
                >
                  Duyệt và phát hành
                </button>
                <button
                  className="text-button"
                  disabled={
                    busy ||
                    dirty ||
                    reason.trim().length < 8 ||
                    d.status === "retired"
                  }
                  onClick={() => void act("retire")}
                >
                  Ngừng chọn cho đề mới
                </button>
              </div>
              {dirty && (
                <p className="field-help">
                  Lưu bản sửa trước khi kiểm tra hoặc đổi trạng thái.
                </p>
              )}
              {result && <CheckResults checks={result} />}
              <LatestCheck d={d} />
            </section>
          </aside>
        </div>
      )}
    </>
  );
}
function LatestCheck({ d }: { d: Detail }) {
  const r = d.revisions[0];
  return r && r.version > 1 ? (
    <div className="bank-check-result">
      <p>Kiểm tra đã lưu · v{r.version}</p>
      <CheckResults checks={r.checks} />
    </div>
  ) : (
    <p className="field-help">
      Bản nhập ban đầu chưa có báo cáo kiểm tra từ quản trị.
    </p>
  );
}
function CheckResults({ checks }: { checks: Check[] }) {
  return checks.length ? (
    <ul className="bank-check-result">
      {checks.map((c, i) => (
        <li key={i}>{c.message}</li>
      ))}
    </ul>
  ) : (
    <p className="field-help">
      Không ghi nhận lỗi cấu trúc trong lần kiểm tra này.
    </p>
  );
}
