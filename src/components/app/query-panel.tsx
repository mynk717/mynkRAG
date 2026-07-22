"use client";

import { useState, useRef, useEffect } from "react";
import { AnswerCard } from "./answer-card";
import { toast } from "sonner";

interface GroundedResponse {
  answer: string;
  sourceLesson: string;
  timestampRange: string;
  snippets: string[];
  explanation: string;
}

interface QueryPanelProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  hasSources: boolean;
}

const SAMPLE_QUERIES = [
  "What were the key concepts covered in the last session?",
  "Explain the main topic discussed around [time].",
  "What was said about building production pipelines?",
  "Summarise the Q&A from the end of the lecture.",
];

function SendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}

function MicIcon({ active }: { active?: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
      <path d="M3 3v5h5"/>
    </svg>
  );
}

function SidebarToggleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <line x1="9" y1="3" x2="9" y2="21"/>
    </svg>
  );
}

function UploadCloudIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 16l-4-4-4 4"/>
      <path d="M12 12v9"/>
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
      <path d="M16 16l-4-4-4 4"/>
    </svg>
  );
}

function Spinner() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 16,
        height: 16,
        border: "2.5px solid currentColor",
        borderTopColor: "transparent",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }}
    />
  );
}

export function QueryPanel({ isSidebarOpen, setIsSidebarOpen, hasSources }: QueryPanelProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<GroundedResponse | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);
  useEffect(() => {
    if (answer) setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }, [answer]);

  const handleSubmit = async (e?: React.FormEvent | React.KeyboardEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q || loading || !hasSources) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Query failed");
      setAnswer(data);
    } catch (err: any) {
      const msg = err.message || "An error occurred";
      setError(msg);
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const handleReset = () => {
    setAnswer(null);
    setError(null);
    setQuery("");
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const s: Record<string, React.CSSProperties> = {
    root:   { display:"flex", flexDirection:"column", height:"100%", backgroundColor:"var(--color-canvas)" },
    header: {
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"12px 20px",
      borderBottom:"1px solid var(--color-line)",
      backgroundColor:"var(--color-surface)",
      flexShrink:0,
    },
    headerLeft: { display:"flex", alignItems:"center", gap:8 },
    pill: {
      fontSize:10, fontWeight:500,
      color:"var(--color-ink-faint)",
      backgroundColor:"var(--color-surface-muted)",
      border:"1px solid var(--color-line)",
      borderRadius:"var(--radius-full)",
      padding:"3px 9px",
    },
    scroll: { flex:1, overflowY:"auto" as const, padding:"32px 24px" },
    inner:  { maxWidth:720, margin:"0 auto", display:"flex", flexDirection:"column", gap:24, width: "100%" },
    inputBar: {
      flexShrink:0,
      borderTop:"1px solid var(--color-line)",
      backgroundColor:"var(--color-surface)",
      padding:"14px 20px",
    },
    form: { maxWidth:720, margin:"0 auto", position:"relative" as const },
    textarea: {
      width:"100%",
      minHeight:56,
      maxHeight:160,
      padding:"14px 100px 14px 16px",
      borderRadius:"var(--radius-xl)",
      border:"1px solid var(--color-line)",
      backgroundColor:"var(--color-surface)",
      fontSize:14,
      lineHeight:1.55,
      color:"var(--color-ink)",
      resize:"none" as const,
      outline:"none",
      transition:"border-color 0.15s, box-shadow 0.15s",
      fontFamily:"inherit",
    },
    btnRow: {
      position:"absolute" as const,
      right:10,
      bottom:10,
      display:"flex",
      alignItems:"center",
      gap:6,
    },
    hint: { fontSize:10, color:"var(--color-ink-faint)", textAlign:"center" as const, marginTop:8 },
  };

  return (
    <div style={s.root}>
      {/* ── Header ──────────────────────────────────────── */}
      <header style={s.header}>
        <div style={s.headerLeft}>
          
          {/* Sidebar Toggle Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            style={{
              background: "none",
              border: "1px solid var(--color-line)",
              borderRadius: "var(--radius-sm)",
              padding: "4px 8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              fontWeight: 500,
              color: "var(--color-ink-muted)",
              marginRight: 6,
              backgroundColor: isSidebarOpen ? "var(--color-surface-muted)" : "var(--color-surface)",
            }}
          >
            <SidebarToggleIcon />
            <span>Library</span>
          </button>

          <span style={{ color:"var(--color-brand-600)" }}><BookIcon /></span>
          <span style={{ fontSize:13, fontWeight:600, color:"var(--color-ink)" }}>Ask Your Courses</span>
          <span style={s.pill}>Answers with timestamps &amp; source evidence</span>
        </div>
        {answer && (
          <button className="btn-ghost" onClick={handleReset} style={{ gap:5, height:30 }}>
            <ResetIcon /> New query
          </button>
        )}
      </header>

      {/* ── Scroll area ─────────────────────────────────── */}
      <div style={s.scroll}>
        <div style={s.inner}>

          {/* 1. Onboarding Empty State (If no files are indexed yet) */}
          {!loading && !error && !answer && !hasSources && (
            <div className="anim-enter" style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:340, gap:20, textAlign:"center" }}>
              <div style={{ width:60, height:60, borderRadius:"var(--radius-xl)", backgroundColor:"oklch(54% 0.26 270 / 0.08)", border:"1px solid oklch(54% 0.26 270 / 0.18)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--color-brand-500)" }}>
                <UploadCloudIcon />
              </div>
              <div style={{ maxWidth:400 }}>
                <h3 style={{ fontSize:16, fontWeight:600, color:"var(--color-ink)", marginBottom:8 }}>
                  Start by uploading course transcripts
                </h3>
                <p style={{ fontSize:12, color:"var(--color-ink-muted)", lineHeight:1.7, margin: 0 }}>
                  Your library is empty. Use the upload panel on the left to add your first subtitle file (.srt or .vtt) to get started.
                </p>
              </div>
              
              {!isSidebarOpen && (
                <button
                  className="btn-brand"
                  onClick={() => setIsSidebarOpen(true)}
                  style={{ gap:6, padding: "0 16px", height: 36 }}
                >
                  Open Sidebar to Upload
                </button>
              )}
            </div>
          )}

          {/* 2. Loading state */}
          {loading && (
            <div className="anim-enter" style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:340, gap:20, textAlign:"center" }}>
              <div style={{ width:56, height:56, borderRadius:"var(--radius-xl)", backgroundColor:"oklch(54% 0.26 270 / 0.10)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--color-brand-600)" }}>
                <Spinner />
              </div>
              <div style={{ maxWidth:320 }}>
                <p style={{ fontSize:14, fontWeight:600, color:"var(--color-ink)", marginBottom:6 }}>
                  Finding your answer…
                </p>
                <p style={{ fontSize:12, color:"var(--color-ink-muted)", lineHeight:1.6 }}>
                  Searching across your transcripts and pinning the answer to the exact moment it was said.
                </p>
              </div>
              <div style={{ width:"100%", maxWidth:480, display:"flex", flexDirection:"column", gap:8, marginTop:8 }}>
                {[100, 80, 90].map((w, i) => (
                  <div key={i} className="anim-shimmer" style={{ height:12, width:`${w}%` }} />
                ))}
              </div>
            </div>
          )}

          {/* 3. Error state */}
          {!loading && error && (
            <div className="anim-enter" style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:340, gap:16, textAlign:"center" }}>
              <div style={{ width:52, height:52, borderRadius:"var(--radius-xl)", backgroundColor:"oklch(58% 0.22 20 / 0.10)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:700, color:"var(--color-danger)" }}>
                !
              </div>
              <div style={{ maxWidth:340 }}>
                <p style={{ fontSize:14, fontWeight:600, color:"var(--color-ink)", marginBottom:6 }}>Query failed</p>
                <p style={{ fontSize:12, color:"var(--color-ink-muted)", lineHeight:1.6 }}>{error}</p>
              </div>
              <button className="btn-ghost" onClick={handleReset} style={{ gap:5 }}>
                <ResetIcon /> Try again
              </button>
            </div>
          )}

          {/* 4. Success Answer state */}
          {!loading && !error && answer && (
            <div ref={resultRef} className="anim-enter" style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--color-ink-faint)" }}>
                  Grounded answer
                </span>
                <span className="badge">1 result</span>
              </div>
              <AnswerCard
                answer={answer.answer}
                sourceLesson={answer.sourceLesson}
                timestampRange={answer.timestampRange}
                snippets={answer.snippets}
                explanation={answer.explanation}
              />
            </div>
          )}

          {/* 5. Idle / Ready to Query state (If files exist but no query run yet) */}
          {!loading && !error && !answer && hasSources && (
            <div className="anim-enter" style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:340, gap:24, textAlign:"center" }}>
              <div style={{ width:56, height:56, borderRadius:"var(--radius-xl)", backgroundColor:"oklch(54% 0.26 270 / 0.10)", border:"1px solid oklch(54% 0.26 270 / 0.18)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--color-brand-500)" }}>
                <BookIcon />
              </div>
              <div style={{ maxWidth:400 }}>
                <h3 style={{ fontSize:16, fontWeight:600, color:"var(--color-ink)", marginBottom:8 }}>
                  Ask anything about the course
                </h3>
                <p style={{ fontSize:12, color:"var(--color-ink-muted)", lineHeight:1.7 }}>
                  Every answer is grounded in your uploaded transcripts — you’ll always see the source lesson, exact timestamp, and the verbatim quote it came from.
                </p>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, width:"100%", maxWidth:480 }}>
                {SAMPLE_QUERIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => { setQuery(q); setTimeout(() => textareaRef.current?.focus(), 50); }}
                    style={{
                      textAlign:"left",
                      fontSize:11,
                      padding:"10px 12px",
                      borderRadius:"var(--radius-lg)",
                      border:"1px solid var(--color-line)",
                      backgroundColor:"var(--color-surface)",
                      color:"var(--color-ink-muted)",
                      cursor:"pointer",
                      lineHeight:1.45,
                      transition:"all 0.15s",
                    }}
                    onMouseEnter={e => {
                      (e.target as HTMLElement).style.borderColor = "oklch(54% 0.26 270 / 0.40)";
                      (e.target as HTMLElement).style.backgroundColor = "oklch(54% 0.26 270 / 0.06)";
                      (e.target as HTMLElement).style.color = "var(--color-ink)";
                    }}
                    onMouseLeave={e => {
                      (e.target as HTMLElement).style.borderColor = "var(--color-line)";
                      (e.target as HTMLElement).style.backgroundColor = "var(--color-surface)";
                      (e.target as HTMLElement).style.color = "var(--color-ink-muted)";
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Input bar ───────────────────────────────────── */}
      <div style={s.inputBar}>
        <form onSubmit={handleSubmit} style={s.form}>
          <textarea
            id="query-input"
            ref={textareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={hasSources ? "Ask a question about your course transcripts…" : "Please upload a file in the sidebar first..."}
            disabled={loading || !hasSources}
            rows={2}
            style={{
              ...s.textarea,
              cursor: hasSources ? "text" : "not-allowed",
              backgroundColor: hasSources ? "var(--color-surface)" : "var(--color-surface-muted)",
            }}
            onFocus={e => {
              if (hasSources) {
                e.target.style.borderColor = "oklch(54% 0.26 270 / 0.60)";
                e.target.style.boxShadow = "0 0 0 3px oklch(54% 0.26 270 / 0.12)";
              }
            }}
            onBlur={e => {
              e.target.style.borderColor = "var(--color-line)";
              e.target.style.boxShadow = "none";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
            }}
          />
          <div style={s.btnRow}>
            {/* Mic - Coming Soon */}
            <button
              type="button"
              disabled
              title="Voice input — coming soon"
              aria-label="Voice input (coming soon)"
              style={{
                width:32, height:32,
                display:"flex", alignItems:"center", justifyContent:"center",
                borderRadius:"var(--radius-md)",
                border:"1px solid var(--color-line)",
                backgroundColor: "var(--color-surface-muted)",
                color: "var(--color-ink-faint)",
                cursor: "not-allowed",
                opacity: 0.45,
              }}
            >
              <MicIcon />
            </button>
            {/* Send */}
            <button
              id="btn-submit-query"
              type="submit"
              disabled={loading || !query.trim() || !hasSources}
              style={{
                width:32, height:32,
                display:"flex", alignItems:"center", justifyContent:"center",
                borderRadius:"var(--radius-md)",
                border:"none",
                backgroundColor: (!loading && query.trim() && hasSources) ? "var(--color-brand-600)" : "var(--color-surface-muted)",
                color: (!loading && query.trim() && hasSources) ? "#fff" : "var(--color-ink-faint)",
                cursor: (!loading && query.trim() && hasSources) ? "pointer" : "not-allowed",
                transition:"all 0.15s",
              }}
            >
              {loading ? <Spinner /> : <SendIcon />}
            </button>
          </div>
        </form>
        <p style={s.hint}>Enter ↵ to send · Shift+Enter for newline</p>
      </div>
    </div>
  );
}
