"use client";
import Link from "next/link";
import { AdminWorkspace } from "./admin-workspace";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  BookOpen,
  SlidersHorizontal,
  Menu,
  X,
  LogOut,
  RotateCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type {
  SourceView,
  UserView,
  AttemptView,
  HistoryRow,
} from "@/lib/types";
type Bootstrap = {
  managedExams?: {
    id: string;
    title: string;
    subject: string;
    language: string;
    minutes: number;
    questions: number;
  }[];
  user: UserView | null;
  sources: SourceView[];
  history: HistoryRow[];
  topics: { topic: string; total: number; correct: number }[];
};
const tracks = [
  {
    id: "micro-en",
    subject: "micro",
    language: "en",
    name: "Vi mô",
    lang: "Tiếng Anh",
  },
  {
    id: "macro-en",
    subject: "macro",
    language: "en",
    name: "Vĩ mô",
    lang: "Tiếng Anh",
  },
  {
    id: "micro-vi",
    subject: "micro",
    language: "vi",
    name: "Vi mô",
    lang: "Tiếng Việt",
  },
  {
    id: "macro-vi",
    subject: "macro",
    language: "vi",
    name: "Vĩ mô",
    lang: "Tiếng Việt",
  },
];
async function api<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch("/api/" + path, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const data = await r.json();
  if (!r.ok) throw Error(data.error || "Không thực hiện được yêu cầu.");
  return data;
}
const date = (s: string) =>
  new Date(s).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
const num = (n: number) => n.toLocaleString("vi-VN");
function Mark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 36 36" className="brand-mark">
      <path d="M6 29V7M6 29H30M10 25L29 8M10 10L29 26" />
      <circle cx="20" cy="17" r="2.5" />
    </svg>
  );
}
export function App() {
  const router = useRouter(),
    path = usePathname();
  const [data, setData] = useState<Bootstrap | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [menu, setMenu] = useState(false),
    [track, setTrack] = useState("micro-en"),
    [start, setStart] = useState<SourceView | null>(null),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api<Bootstrap>("bootstrap"));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    setMenu(false);
    setError("");
  }, [path]);
  const nav = !data
    ? []
    : data?.user?.role === "admin"
      ? [["/quan-tri", "Khu quản trị"]]
      : [
          ["/", "Kho đề"],
          ["/tao-de", "Tạo đề"],
          ["/hanh-trinh", "Hành trình"],
        ];
  useEffect(() => {
    if (
      data?.user?.role === "admin" &&
      !path.startsWith("/quan-tri") &&
      path !== "/tai-khoan"
    )
      router.replace("/quan-tri");
  }, [data?.user?.role, path, router]);
  const active = tracks.find((t) => t.id === track)!;
  const sources =
    data?.sources.filter(
      (s) => s.subject === active.subject && s.language === active.language,
    ) || [];
  async function begin(
    sourceIds: string[],
    mode: "practice" | "exam",
    kind: "original" | "mixed",
    count: number,
    minutes: number,
  ) {
    setBusy(true);
    setError("");
    try {
      const r = await api<{ id: string }>("attempts", {
        sourceIds,
        mode,
        kind,
        count,
        minutes,
        difficulty: "any",
        choicePercent: 100,
      });
      setStart(null);
      router.push("/bai-lam/" + r.id);
      void load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const attemptId = path.startsWith("/bai-lam/") ? path.split("/")[2] : null;
  return (
    <>
      <a className="skip-link" href="#main">
        Đến nội dung
      </a>
      <header className="topbar">
        <div className="topbar-inner">
          <Link
            href={data?.user?.role === "admin" ? "/quan-tri" : "/"}
            className="brand"
            aria-label="Ôn MiMacro, về kho đề"
          >
            <Mark />
            <span>Ôn MiMacro</span>
          </Link>
          <nav
            aria-label="Điều hướng chính"
            className={menu ? "nav open" : "nav"}
          >
            {nav.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                aria-current={path === href ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="account-nav">
            <Link href="/tai-khoan" className="account-link">
              {data?.user?.displayName || "Đăng nhập"}
              <ArrowUpRight size={14} />
            </Link>
            <button
              className="mobile-menu icon-button"
              aria-label={menu ? "Đóng menu" : "Mở menu"}
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <main id="main" className={attemptId ? "main workspace" : "main"}>
        {error && (
          <div className="notice error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
            <button className="text-button" onClick={() => setError("")}>
              Đóng
            </button>
          </div>
        )}
        {loading && !data ? (
          <div className="loading-state" role="status">
            <h1>Đang mở kho đề</h1>
            <p>Đang tải ngân hàng câu hỏi và tiến trình đã lưu.</p>
            <div className="skeleton" />
            <div className="skeleton short" />
          </div>
        ) : !data ? (
          <div className="empty-state">
            <h1>Chưa kết nối được kho đề</h1>
            <p>
              Kiểm tra kết nối database rồi thử lại. Không có dữ liệu giả thay
              cho ngân hàng.
            </p>
            <button onClick={load}>
              <RotateCw size={16} /> Thử lại
            </button>
          </div>
        ) : (
          <>
            {(data.user?.role === "admin" && path !== "/tai-khoan") ||
            path.startsWith("/quan-tri") ? (
              <AdminWorkspace
                user={data.user}
                path={path.startsWith("/quan-tri") ? path : "/quan-tri"}
              />
            ) : attemptId ? (
              <Exam id={attemptId} onError={setError} onComplete={load} />
            ) : path === "/tao-de" ? (
              <>
                <div className="page-title">
                  <div>
                    <h1>Tạo đề của bạn</h1>
                    <p>Chọn phạm vi. Mỗi chương góp một phần vào đề mới.</p>
                  </div>
                  <SlidersHorizontal className="page-icon" size={22} />
                </div>
                <TrackPicker
                  track={track}
                  setTrack={setTrack}
                  sources={data.sources}
                />
                <Builder
                  key={track}
                  sources={sources}
                  busy={busy}
                  onStart={begin}
                />
              </>
            ) : path === "/hanh-trinh" ? (
              <History data={data} />
            ) : path === "/tai-khoan" ? (
              <Account user={data.user} onChange={load} onError={setError} />
            ) : (
              <>
                <div className="page-title">
                  <div>
                    <h1>Học từ câu hỏi. Hiểu qua lời giải.</h1>
                    <p>Chọn một bộ câu hỏi gốc hoặc ghép đề mới theo chương.</p>
                  </div>
                  <Link href="/tao-de" className="button">
                    Tạo đề mới <ArrowUpRight size={16} />
                  </Link>
                </div>
                <TrackPicker
                  track={track}
                  setTrack={setTrack}
                  sources={data.sources}
                />
                {!!data.managedExams?.filter(
                  (e) =>
                    e.subject === active.subject &&
                    e.language === active.language,
                ).length && (
                  <section className="panel managed-catalog">
                    <h2>Đề do quản trị phát hành</h2>
                    {data.managedExams
                      .filter(
                        (e) =>
                          e.subject === active.subject &&
                          e.language === active.language,
                      )
                      .map((e) => (
                        <div className="admin-data-row" key={e.id}>
                          <div>
                            <h3>{e.title}</h3>
                            <p>
                              {e.questions} câu · {e.minutes} phút
                            </p>
                          </div>
                          <div className="button-row">
                            {(["practice", "exam"] as const).map((mode) => (
                              <button
                                className="secondary"
                                key={mode}
                                disabled={busy}
                                onClick={async () => {
                                  setBusy(true);
                                  try {
                                    const r = await api<{ id: string }>(
                                      "attempts",
                                      { managedExamId: e.id, mode },
                                    );
                                    router.push("/bai-lam/" + r.id);
                                  } catch (err) {
                                    setError((err as Error).message);
                                  } finally {
                                    setBusy(false);
                                  }
                                }}
                              >
                                {mode === "exam" ? "Thi thử" : "Luyện tập"}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                  </section>
                )}
                <div className="catalog-layout">
                  <section
                    className="panel catalog-panel"
                    aria-labelledby="bank-title"
                  >
                    <div className="panel-header">
                      <div>
                        <h2 id="bank-title">
                          Ngân hàng {active.name.toLowerCase()}
                        </h2>
                        <p>
                          {active.lang} · {sources.length} chương ·{" "}
                          {num(sources.reduce((n, s) => n + s.available, 0))}{" "}
                          câu sẵn sàng
                        </p>
                      </div>
                      <BookOpen size={20} />
                    </div>
                    {sources.length ? (
                      sources.map((s) => (
                        <div className="source-row" key={s.id}>
                          <span className="chapter-number">{s.chapter}</span>
                          <div className="source-info">
                            <h3>{s.topic}</h3>
                            <p>
                              Frank · Chương {s.chapter}
                              {s.issues > 0
                                ? ` · ${s.issues} câu chờ kiểm tra`
                                : ""}
                            </p>
                          </div>
                          <div className="source-count">
                            <span className="num">{num(s.available)}</span>
                            <small>câu hỏi</small>
                          </div>
                          <button
                            className="secondary"
                            onClick={() => setStart(s)}
                            disabled={s.available !== s.questionCount}
                            title={
                              s.available !== s.questionCount
                                ? "Đề gốc có câu đang chờ kiểm tra; có thể tạo đề mới từ câu hợp lệ."
                                : undefined
                            }
                          >
                            Mở bộ gốc <ArrowRight size={14} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">
                        <h3>Chưa có nguồn đủ điều kiện</h3>
                        <p>
                          Nội dung {active.name.toLowerCase()}{" "}
                          {active.lang.toLowerCase()} sẽ xuất hiện sau khi nhập
                          đầy đủ đề và đáp án.
                        </p>
                      </div>
                    )}
                  </section>
                  <aside className="catalog-aside">
                    <section className="panel">
                      <h2>Hai cách ôn tập</h2>
                      <div className="mode-description">
                        <span className="small-icon">
                          <BookOpen size={18} />
                        </span>
                        <div>
                          <h3>Luyện tập</h3>
                          <p>
                            Trả lời từng câu, xem kết quả và giải thích ngay.
                          </p>
                        </div>
                      </div>
                      <div className="mode-description">
                        <span className="small-icon">
                          <Clock3 size={18} />
                        </span>
                        <div>
                          <h3>Thi thử</h3>
                          <p>
                            Giữ nhịp với đồng hồ. Xem đáp án sau khi nộp toàn bộ
                            bài.
                          </p>
                        </div>
                      </div>
                    </section>
                    <section className="panel recent-panel">
                      <div className="panel-header">
                        <h2>Tiếp tục ôn</h2>
                        <Link href="/hanh-trinh">Xem tất cả</Link>
                      </div>
                      {data.history
                        .filter((h) => h.status === "in_progress")
                        .slice(0, 3)
                        .map((h) => (
                          <Link
                            className="recent-row"
                            href={"/bai-lam/" + h.id}
                            key={h.id}
                          >
                            <span>
                              {h.title}
                              <small>
                                {h.mode === "exam" ? "Thi thử" : "Luyện tập"} ·{" "}
                                {date(h.startedAt)}
                              </small>
                            </span>
                            <ArrowUpRight size={16} />
                          </Link>
                        ))}
                      {!data.history.some(
                        (h) => h.status === "in_progress",
                      ) && (
                        <p className="empty-copy">
                          Chưa có bài đang làm. Chọn một chương để bắt đầu.
                        </p>
                      )}
                    </section>
                    {sources.some((s) => s.issues > 0) && (
                      <section className="panel source-note">
                        <h2>Nguồn và đáp án</h2>
                        <p>
                          Các bộ gốc giữ nguyên thứ tự. Câu có lời giải chờ kiểm
                          tra chưa được mở để chấm. Khi ghép đề mới, hệ thống
                          chỉ chọn những câu đủ điều kiện.
                        </p>
                        <Link href="/tao-de">
                          Ghép đề theo chương <ArrowUpRight size={13} />
                        </Link>
                      </section>
                    )}
                  </aside>
                </div>
                <p className="development-note">
                  Bản thử nghiệm trên máy · Chưa áp dụng hạn mức miễn phí và gói
                  trả phí. Độ khó câu hỏi chưa được gán.
                </p>
              </>
            )}
          </>
        )}
      </main>
      {start && (
        <StartDialog
          source={start}
          busy={busy}
          onClose={() => setStart(null)}
          onStart={(mode, minutes) =>
            begin([start.id], mode, "original", start.questionCount, minutes)
          }
        />
      )}
    </>
  );
}
function TrackPicker({
  track,
  setTrack,
  sources,
}: {
  track: string;
  setTrack: (t: string) => void;
  sources: SourceView[];
}) {
  return (
    <div className="track-picker" role="group" aria-label="Môn và ngôn ngữ">
      {tracks.map((t) => (
        <button
          key={t.id}
          className={track === t.id ? "track active" : "track"}
          aria-pressed={track === t.id}
          onClick={() => setTrack(t.id)}
        >
          <span>
            {t.name}
            <small>{t.lang}</small>
          </span>
          <span className="track-total num">
            {
              sources.filter(
                (s) => s.subject === t.subject && s.language === t.language,
              ).length
            }
            <small>chương</small>
          </span>
        </button>
      ))}
    </div>
  );
}
function useModalFocus(enabled: boolean, onClose: () => void, busy: boolean) {
  const ref = useRef<HTMLElement>(null);
  const close = useRef(onClose),
    pending = useRef(busy);
  close.current = onClose;
  pending.current = busy;
  useEffect(() => {
    if (!enabled) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusable = () =>
      Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href],[tabindex="0"]',
        ) || [],
      );
    focusable()[0]?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!pending.current) close.current();
      }
      if (event.key === "Tab") {
        const items = focusable();
        const first = items[0],
          last = items[items.length - 1];
        if (!first) return;
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            !ref.current?.contains(document.activeElement))
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last ||
            !ref.current?.contains(document.activeElement))
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      if (previous?.isConnected) previous.focus();
    };
  }, [enabled]);
  return ref;
}
function StartDialog({
  source,
  busy,
  onClose,
  onStart,
}: {
  source: SourceView;
  busy: boolean;
  onClose: () => void;
  onStart: (m: "practice" | "exam", n: number) => void;
}) {
  const [mode, setMode] = useState<"practice" | "exam">("practice"),
    [minutes, setMinutes] = useState(90);
  const modalRef = useModalFocus(true, onClose, busy);
  return (
    <div className="modal-backdrop">
      <section
        ref={modalRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-title"
      >
        <div className="panel-header">
          <h2 id="start-title">{source.topic}</h2>
          <button
            autoFocus
            className="icon-button"
            aria-label="Đóng"
            onClick={onClose}
            disabled={busy}
          >
            <X size={20} />
          </button>
        </div>
        <p>
          {source.title} · {source.questionCount} câu gốc. Giữ nguyên thứ tự và
          lựa chọn của nguồn.
        </p>
        <fieldset>
          <legend>Chế độ làm bài</legend>
          <label className="radio-row">
            <input
              type="radio"
              name="mode"
              checked={mode === "practice"}
              onChange={() => setMode("practice")}
            />
            Luyện tập — giải thích từng câu
          </label>
          <label className="radio-row">
            <input
              type="radio"
              name="mode"
              checked={mode === "exam"}
              onChange={() => setMode("exam")}
            />
            Thi thử — giải thích sau khi nộp
          </label>
        </fieldset>
        <label className="field">
          Thời gian làm bài (phút)
          <input
            type="number"
            min={1}
            max={600}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
          />
        </label>
        <button
          disabled={busy || minutes < 1 || minutes > 600}
          onClick={() => onStart(mode, minutes)}
        >
          {busy ? "Đang mở đề…" : "Bắt đầu làm bài"}
          <ArrowRight size={16} />
        </button>
      </section>
    </div>
  );
}
function Builder({
  sources,
  busy,
  onStart,
}: {
  sources: SourceView[];
  busy: boolean;
  onStart: (
    ids: string[],
    mode: "practice" | "exam",
    kind: "original" | "mixed",
    count: number,
    minutes: number,
  ) => Promise<void>;
}) {
  const [selected, setSelected] = useState(sources.map((s) => s.id)),
    [count, setCount] = useState(30),
    [minutes, setMinutes] = useState(45),
    [mode, setMode] = useState<"practice" | "exam">("exam");
  const chosen = sources.filter((s) => selected.includes(s.id)),
    available = chosen.reduce((n, s) => n + s.available, 0);
  if (!sources.length)
    return (
      <section className="panel empty-state">
        <h2>Chưa thể ghép đề cho nhóm này</h2>
        <p>
          Cần nguồn câu hỏi và đáp án trước khi tạo đề. Bạn có thể chọn nhóm
          tiếng Anh đã có dữ liệu.
        </p>
      </section>
    );
  return (
    <div className="builder-layout">
      <form
        className="panel builder-form"
        onSubmit={(e) => {
          e.preventDefault();
          void onStart(selected, mode, "mixed", count, minutes);
        }}
      >
        <fieldset>
          <legend>Phạm vi kiến thức</legend>
          <p className="field-help">
            Chọn chương muốn ôn. Đề sẽ phân bổ đều số câu giữa các chương đã
            chọn.
          </p>
          {sources.map((s) => (
            <label className="chapter-choice" key={s.id}>
              <input
                type="checkbox"
                checked={selected.includes(s.id)}
                onChange={(e) =>
                  setSelected(
                    e.target.checked
                      ? [...selected, s.id]
                      : selected.filter((id) => id !== s.id),
                  )
                }
              />
              <span>
                Chương {s.chapter} · {s.topic}
              </span>
              <span className="num muted">{s.available} câu</span>
            </label>
          ))}
        </fieldset>
        <div className="field-grid">
          <label className="field">
            Số câu
            <input
              type="number"
              min={1}
              max={250}
              required
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            />
          </label>
          <label className="field">
            Thời gian (phút)
            <input
              type="number"
              min={1}
              max={600}
              required
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
            />
          </label>
          <label className="field">
            Chế độ
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as typeof mode)}
            >
              <option value="exam">Thi thử</option>
              <option value="practice">Luyện tập</option>
            </select>
          </label>
          <label className="field">
            Độ khó
            <select aria-describedby="difficulty-note">
              <option>Chưa phân loại</option>
            </select>
          </label>
        </div>
        <p className="field-help" id="difficulty-note">
          Ngân hàng chưa có nhãn độ khó đủ căn cứ. Không tự gán dễ/khó.
        </p>
        <div className="type-summary">
          <span>Tỷ lệ dạng bài</span>
          <strong className="num">100% trắc nghiệm</strong>
          <p className="field-help">
            Nguồn đã nhập hiện là trắc nghiệm. Tự luận và đồ thị sẽ được mở khi
            có đáp án, rubric và bộ chấm.
          </p>
        </div>
        <button
          disabled={
            busy ||
            !selected.length ||
            count < selected.length ||
            count > available ||
            minutes < 1 ||
            minutes > 600
          }
          type="submit"
        >
          {busy ? "Đang ghép đề…" : "Tạo và bắt đầu"}
          <ArrowRight size={16} />
        </button>
      </form>
      <aside className="panel distribution">
        <h2>Phân bổ dự kiến</h2>
        <p className="field-help">Chọn câu từ kho, không gọi AI khi ghép đề.</p>
        <div className="distribution-total">
          <span className="num">{count}</span>
          <span>câu / {selected.length} chương</span>
        </div>
        {chosen.map((s, i) => {
          const n =
            Math.floor(count / chosen.length) +
            (i < count % chosen.length ? 1 : 0);
          return (
            <div key={s.id} className="distribution-row">
              <div>
                <span>Chương {s.chapter}</span>
                <span className="num">{n} câu</span>
              </div>
              <div className="distribution-track">
                <span
                  style={{
                    width: `${Math.min(100, (n / Math.max(count, 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
        <p className="field-help">
          Kho có {num(available)} câu hợp lệ trong phạm vi này. Hệ thống kiểm
          tra câu trùng trước khi mở đề.
        </p>
        {count < selected.length && (
          <p role="alert" className="error-text">
            Cần ít nhất một câu cho mỗi chương.
          </p>
        )}
      </aside>
    </div>
  );
}
function Exam({
  id,
  onError,
  onComplete,
}: {
  id: string;
  onError: (s: string) => void;
  onComplete: () => Promise<void>;
}) {
  const [reportMessage, setReportMessage] = useState("");
  const [attempt, setAttempt] = useState<AttemptView | null>(null),
    [index, setIndex] = useState(0),
    [selections, setSelections] = useState<Record<string, string>>({}),
    [busy, setBusy] = useState(false),
    [now, setNow] = useState(Date.now()),
    [offset, setOffset] = useState(0),
    [confirm, setConfirm] = useState(false);
  const confirmRef = useModalFocus(confirm, () => setConfirm(false), busy);
  const update = useCallback((a: AttemptView) => {
    setAttempt(a);
    setOffset(new Date(a.serverNow).getTime() - Date.now());
  }, []);
  const reload = useCallback(async () => {
    try {
      update(await api<AttemptView>("attempts/" + id));
    } catch (e) {
      onError((e as Error).message);
    }
  }, [id, onError, update]);
  useEffect(() => {
    setAttempt(null);
    setIndex(0);
    setSelections({});
    void reload();
  }, [reload]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const remaining = attempt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(attempt.deadlineAt).getTime() - (now + offset)) / 1000,
        ),
      )
    : 1;
  useEffect(() => {
    if (attempt?.status === "in_progress" && remaining === 0) void reload();
  }, [remaining, attempt?.status, reload]);
  if (!attempt)
    return (
      <div className="loading-state" role="status">
        <h1>Đang mở bài làm</h1>
        <p>Đang khôi phục câu trả lời và thời gian đã lưu.</p>
        <div className="skeleton" />
      </div>
    );
  const q = attempt.questions[index],
    completed = attempt.status === "completed",
    saved = attempt.responses[q.id]?.optionId,
    selected = completed ? saved || "" : selections[q.id] || saved || "",
    answered = Object.keys(attempt.responses).length;
  const answeredCurrent = !!saved,
    practiceLocked = attempt.mode === "practice" && answeredCurrent;
  const hasUnsaved =
    attempt.mode === "exam" &&
    Object.entries(selections).some(
      ([qid, value]) => attempt.responses[qid]?.optionId !== value,
    );
  async function save() {
    if (!selected) return;
    setBusy(true);
    onError("");
    try {
      update(
        await api<AttemptView>(`attempts/${id}/answer`, {
          questionId: q.id,
          optionId: selected,
        }),
      );
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function choose(optionId: string) {
    setSelections((s) => ({ ...s, [q.id]: optionId }));
    if (attempt!.mode === "exam") {
      setBusy(true);
      onError("");
      try {
        update(
          await api<AttemptView>(`attempts/${id}/answer`, {
            questionId: q.id,
            optionId,
          }),
        );
      } catch (e) {
        onError((e as Error).message);
      } finally {
        setBusy(false);
      }
    }
  }
  async function submit() {
    setBusy(true);
    onError("");
    try {
      const a = await api<AttemptView>(`attempts/${id}/submit`, {});
      update(a);
      setConfirm(false);
      void onComplete();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="exam-heading">
        <div>
          <Link href="/" className="back-link">
            <ArrowLeft size={14} />
            Kho đề
          </Link>
          <h1>{attempt.title}</h1>
          <p>
            {completed
              ? "Xem lại bài làm"
              : attempt.mode === "exam"
                ? "Thi thử · Đáp án mở sau khi nộp bài"
                : "Luyện tập · Giải thích sau mỗi câu"}
          </p>
        </div>
        {!completed && (
          <div
            className={remaining < 300 ? "timer urgent" : "timer"}
            aria-label="Thời gian còn lại"
          >
            <Clock3 size={18} />
            <span className="num">
              {String(Math.floor(remaining / 60)).padStart(2, "0")}:
              {String(remaining % 60).padStart(2, "0")}
            </span>
          </div>
        )}
      </div>
      {completed && (
        <section className="result-strip" aria-label="Kết quả">
          <div>
            <span>Điểm bài làm</span>
            <strong className="num">
              {attempt.score?.toFixed(2)}
              <small>/10</small>
            </strong>
          </div>
          <div>
            <span>Câu trả lời đúng</span>
            <strong className="num">
              {attempt.correctCount}
              <small>/{attempt.questions.length}</small>
            </strong>
          </div>
          <div className="result-action">
            <p>Mở từng câu để đối chiếu đáp án và lời giải.</p>
            <Link href="/tao-de" className="button secondary">
              Tạo đề tiếp theo <ArrowUpRight size={14} />
            </Link>
          </div>
        </section>
      )}
      <div className="exam-layout">
        <section
          className="panel question-panel"
          aria-labelledby="question-title"
        >
          <div className="question-heading">
            <h2 id="question-title">
              Câu {index + 1}
              <span className="muted"> / {attempt.questions.length}</span>
            </h2>
            <span className="question-topic">{q.topic}</span>
          </div>
          <div
            className="question-content"
            lang={attempt.language}
            dangerouslySetInnerHTML={{ __html: q.html }}
          />
          <fieldset
            className="options"
            disabled={completed || practiceLocked || busy}
          >
            <legend className="sr-only">Chọn một đáp án</legend>
            {q.options.map((o, i) => {
              const review = q.review;
              const isChosen = selected === o.id;
              const correct = !!review && review.answer === o.id;
              const wrong = !!review && isChosen && !correct;
              return (
                <label
                  key={o.id}
                  className={`option ${isChosen ? "selected" : ""} ${correct ? "correct" : ""} ${wrong ? "wrong" : ""}`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={o.id}
                    checked={isChosen}
                    onChange={() => void choose(o.id)}
                  />
                  <span className="option-letter">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="option-text" lang={attempt.language}>
                    {o.html ? (
                      <span dangerouslySetInnerHTML={{ __html: o.html }} />
                    ) : (
                      o.text
                    )}
                  </span>
                  {correct ? (
                    <CheckCircle2 size={18} aria-label="Đáp án đúng" />
                  ) : wrong ? (
                    <X size={18} aria-label="Đáp án đã chọn sai" />
                  ) : null}
                </label>
              );
            })}
          </fieldset>
          {!completed && (
            <div className="answer-state" aria-live="polite">
              {busy ? (
                "Đang lưu…"
              ) : saved && selected === saved ? (
                <>
                  <Check size={14} />
                  Đã lưu câu trả lời
                </>
              ) : selected ? (
                "Câu trả lời chưa được lưu"
              ) : (
                "Chưa trả lời"
              )}
              {selected &&
                selected !== saved &&
                attempt.mode === "exam" &&
                !busy && (
                  <button className="text-button" onClick={save}>
                    Thử lưu lại
                  </button>
                )}
            </div>
          )}
          {q.review && (
            <div className="explanation">
              <h3>{q.review.correct ? "Chính xác" : "Đối chiếu đáp án"}</h3>
              <p>
                Đáp án đúng:{" "}
                <strong>
                  {String.fromCharCode(
                    65 + q.options.findIndex((o) => o.id === q.review!.answer),
                  )}
                </strong>
                {!saved ? " · Bạn chưa trả lời câu này." : ""}
              </p>
              <div
                className="explanation-content"
                lang={attempt.language}
                dangerouslySetInnerHTML={{
                  __html: q.review.explanationHtml || q.review.explanation,
                }}
              />
            </div>
          )}
          <div className="question-footer">
            <button
              className="secondary"
              disabled={index === 0 || busy}
              onClick={() => setIndex(index - 1)}
            >
              <ArrowLeft size={16} />
              Câu trước
            </button>
            {!completed && attempt.mode === "practice" && !saved ? (
              <button disabled={!selected || busy} onClick={save}>
                Kiểm tra đáp án
                <Check size={16} />
              </button>
            ) : (
              <button
                disabled={index === attempt.questions.length - 1 || busy}
                onClick={() => setIndex(index + 1)}
              >
                Câu tiếp
                <ArrowRight size={16} />
              </button>
            )}
          </div>
          <details className="learner-report">
            <summary>Báo lỗi câu hỏi</summary>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const f = new FormData(form);
                try {
                  await api("reports", {
                    attemptId: id,
                    questionId: q.id,
                    detail: f.get("detail"),
                  });
                  form.reset();
                  setReportMessage("Đã gửi phản hồi cho quản trị.");
                } catch (err) {
                  setReportMessage((err as Error).message);
                }
              }}
            >
              <label className="field">
                Nội dung cần kiểm tra
                <textarea
                  name="detail"
                  minLength={8}
                  maxLength={2000}
                  required
                />
              </label>
              <button className="secondary" type="submit">
                Gửi phản hồi
              </button>
              <p role="status">{reportMessage}</p>
            </form>
          </details>
          <p className="source-caption">
            Nguồn: {q.sourceTitle} · Câu {q.number}
          </p>
        </section>
        <aside className="exam-aside">
          <section className="panel navigation-panel">
            <h2>Tiến độ bài làm</h2>
            <p>
              <span className="num">
                {answered}/{attempt.questions.length}
              </span>{" "}
              câu đã trả lời
            </p>
            <progress
              max={attempt.questions.length}
              value={answered}
              aria-label="Số câu đã trả lời"
            />
            <details open className="question-map">
              <summary>Danh sách câu hỏi</summary>
              <div className="question-grid">
                {attempt.questions.map((item, i) => (
                  <button
                    key={item.id}
                    disabled={busy}
                    onClick={() => setIndex(i)}
                    className={`${index === i ? "current" : ""} ${attempt.responses[item.id] ? "answered" : ""}`}
                    aria-label={`Câu ${i + 1}${attempt.responses[item.id] ? ", đã trả lời" : ""}`}
                    aria-current={index === i ? "step" : undefined}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </details>
            {!completed && (
              <button
                className="submit-button"
                disabled={busy || hasUnsaved}
                onClick={() => setConfirm(true)}
              >
                Nộp bài
                <ArrowUpRight size={16} />
              </button>
            )}
          </section>
          <p className="field-help">
            {hasUnsaved && !completed
              ? "Có câu trả lời chưa lưu. Hãy quay lại câu đó và thử lưu trước khi nộp."
              : completed
                ? "Điểm trắc nghiệm được đối chiếu với đáp án nguồn."
                : "Câu trả lời được lưu trên máy chủ. Tải lại trang để tiếp tục đúng lượt làm."}
          </p>
        </aside>
      </div>
      {confirm && (
        <div className="modal-backdrop">
          <section
            ref={confirmRef}
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="submit-title"
          >
            <h2 id="submit-title">Nộp bài làm?</h2>
            <p>
              Bạn đã trả lời {answered}/{attempt.questions.length} câu.{" "}
              {attempt.questions.length - answered > 0
                ? `Còn ${attempt.questions.length - answered} câu bỏ trống.`
                : ""}{" "}
              Sau khi nộp, bạn có thể xem đáp án và giải thích.
            </p>
            <div className="button-row">
              <button
                autoFocus
                className="secondary"
                disabled={busy}
                onClick={() => setConfirm(false)}
              >
                Tiếp tục làm
              </button>
              <button disabled={busy} onClick={submit}>
                {busy ? "Đang nộp…" : "Xác nhận nộp bài"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
function History({ data }: { data: Bootstrap }) {
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Hành trình ôn tập</h1>
          <p>Kết quả bài làm và những phần kiến thức cần quay lại.</p>
        </div>
        <Link className="button" href="/tao-de">
          Tạo đề mới
          <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="history-layout">
        <section className="panel">
          <div className="panel-header">
            <h2>Bài làm của bạn</h2>
            <span className="muted num">{data.history.length} lượt</span>
          </div>
          {data.history.length ? (
            <div className="history-list">
              {data.history.map((h) => (
                <Link
                  href={"/bai-lam/" + h.id}
                  className="history-row"
                  key={h.id}
                >
                  <div>
                    <h3>{h.title}</h3>
                    <p>
                      {h.mode === "exam" ? "Thi thử" : "Luyện tập"} ·{" "}
                      {date(h.startedAt)}
                    </p>
                  </div>
                  <div className="history-value">
                    {h.status === "completed" ? (
                      <>
                        <span className="num">
                          {h.score?.toFixed(2)}
                          <small>/10</small>
                        </span>
                        <small>
                          {h.correctCount}/{h.questionCount} câu đúng
                        </small>
                      </>
                    ) : (
                      <span className="status-label">Đang làm</span>
                    )}
                  </div>
                  <ArrowUpRight size={16} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>Hành trình bắt đầu từ một câu hỏi</h3>
              <p>Chưa có lượt làm bài. Chọn một bộ đề để bắt đầu.</p>
              <Link href="/" className="button secondary">
                Chọn đề
              </Link>
            </div>
          )}
        </section>
        <aside className="panel">
          <h2>Kiến thức đã luyện</h2>
          {data.topics.length ? (
            data.topics.map((t) => (
              <div className="topic-stat" key={t.topic}>
                <h3>{t.topic}</h3>
                <p>
                  {t.correct}/{t.total} câu đúng ·{" "}
                  {t.total < 10
                    ? "Chưa đủ quan sát để kết luận"
                    : t.correct / t.total < 0.6
                      ? "Nên luyện thêm"
                      : "Tiếp tục củng cố"}
                </p>
                <div className="distribution-track">
                  <span style={{ width: `${(t.correct / t.total) * 100}%` }} />
                </div>
              </div>
            ))
          ) : (
            <p className="empty-copy">
              Hoàn thành một đề để thấy kết quả theo chủ đề. Không có dữ liệu
              được ước đoán trước.
            </p>
          )}
        </aside>
      </div>
      {!data.user && (
        <p className="development-note">
          Lịch sử này thuộc phiên khách trên trình duyệt. Đăng nhập để lưu các
          lượt làm tiếp theo vào tài khoản cá nhân.
        </p>
      )}
    </>
  );
}
function Account({
  user,
  onChange,
  onError,
}: {
  user: UserView | null;
  onChange: () => Promise<void>;
  onError: (s: string) => void;
}) {
  const [register, setRegister] = useState(false),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    setRegister(false);
  }, [user?.id]);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    onError("");
    try {
      await api(register ? "auth/register" : "auth/login", {
        username: f.get("username"),
        password: f.get("password"),
        ...(register ? { displayName: f.get("displayName") } : {}),
      });
      await onChange();
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-title">
        <div>
          <h1>
            {user
              ? "Tài khoản của bạn"
              : register
                ? "Tạo tài khoản"
                : "Đăng nhập"}
          </h1>
          <p>Lưu các lượt làm bài và tiến trình ôn tập cá nhân.</p>
        </div>
      </div>
      {user ? (
        <section className="panel account-panel">
          <h2>{user.displayName}</h2>
          <p>@{user.username}</p>
          <p>
            {user.role === "admin"
              ? "Tài khoản chỉ quản trị nội dung và vận hành, không có quyền làm bài."
              : "Các lượt làm mới được lưu vào tài khoản này. Gói trả phí chưa được mở."}
          </p>
          <div className="button-row">
            <Link
              className="button"
              href={user.role === "admin" ? "/quan-tri" : "/hanh-trinh"}
            >
              {user.role === "admin" ? "Vào khu quản trị" : "Xem hành trình"}
              <ArrowUpRight size={16} />
            </Link>
            <button
              className="secondary"
              onClick={async () => {
                await api("auth/logout", {});
                await onChange();
              }}
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
        </section>
      ) : (
        <form className="panel account-panel" onSubmit={submit}>
          {register && (
            <label className="field">
              Tên hiển thị
              <input
                name="displayName"
                autoComplete="name"
                required
                minLength={2}
                maxLength={80}
              />
            </label>
          )}
          <label className="field">
            Tên đăng nhập
            <input
              name="username"
              autoComplete="username"
              required
              pattern="[A-Za-z0-9_]{3,32}"
              aria-describedby="username-help"
            />
          </label>
          <p className="field-help" id="username-help">
            3–32 ký tự gồm chữ không dấu, số và dấu gạch dưới.
          </p>
          <label className="field">
            Mật khẩu
            <input
              name="password"
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
              required
              minLength={8}
              maxLength={128}
            />
          </label>
          <p className="field-help">Tối thiểu 8 ký tự.</p>
          <button type="submit" disabled={busy}>
            {busy ? "Đang xử lý…" : register ? "Tạo tài khoản" : "Đăng nhập"}
            <ArrowRight size={16} />
          </button>
          <p className="auth-switch">
            {register ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
            <button
              className="text-button"
              type="button"
              onClick={() => setRegister(!register)}
            >
              {register ? "Đăng nhập" : "Đăng ký"}
            </button>
          </p>
        </form>
      )}
    </>
  );
}
