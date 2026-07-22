"use client";

import { useState, useRef, useEffect } from "react";
import { AnswerCard } from "./answer-card";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  isLoading?: boolean;
  sourceLesson?: string;
  timestampRange?: string;
  snippets?: string[];
  explanation?: string;
  sourceUrl?: string;
  sourceType?: string;
  startMs?: number | null;
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

function MicIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, loading]);

  const handleSubmit = async (e?: React.FormEvent | React.KeyboardEvent, customQuery?: string) => {
    e?.preventDefault();
    const q = (customQuery ?? query).trim();
    if (!q || loading || !hasSources) return;

    setLoading(true);
    setError(null);
    setQuery("");

    const randomSuffix = () => Math.random().toString(36).substring(2, 9);
    const userMessageId = `user-${Date.now()}-${randomSuffix()}`;
    const assistantPlaceholderId = `assistant-placeholder-${Date.now()}-${randomSuffix()}`;

    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: "user", text: q },
      { id: assistantPlaceholderId, role: "assistant", text: "", isLoading: true }
    ]);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Query failed");

      // 3. Update the temporary Assistant Message with actual response data
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantPlaceholderId
            ? {
                id: `assistant-${Date.now()}-${randomSuffix()}`,
                role: "assistant",
                text: data.answer,
                sourceLesson: data.sourceLesson,
                timestampRange: data.timestampRange,
                snippets: data.snippets,
                explanation: data.explanation,
                sourceUrl: data.sourceUrl,
                sourceType: data.sourceType,
                startMs: data.startMs,
              }
            : msg
        )
      );
    } catch (err: any) {
      const msg = err.message || "An error occurred";
      setError(msg);
      toast.error(msg);
      // Remove the loader if the request failed
      setMessages((prev) => prev.filter((m) => m.id !== assistantPlaceholderId));
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleReset = () => {
    setMessages([]);
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
    scroll: { flex:1, overflowY:"auto" as const, padding:"24px 20px" },
    inner:  { maxWidth:720, margin:"0 auto", display:"flex", flexDirection:"column", gap:20, width: "100%" },
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
        {messages.length > 0 && (
          <button className="btn-ghost" onClick={handleReset} style={{ gap:5, height:30 }}>
            <ResetIcon /> New query
          </button>
        )}
      </header>

      {/* ── Scroll area ─────────────────────────────────── */}
      <div style={s.scroll}>
        <div style={s.inner}>

          {/* 1. Onboarding Empty State (If no files are indexed yet) */}
          {!hasSources && (
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

          {/* 2. Welcome State (If sources exist but thread is empty) */}
          {hasSources && messages.length === 0 && (
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
                    onClick={(e) => { handleSubmit(e, q); }}
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

          {/* 3. Conversation Thread */}
          {messages.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {messages.map((msg) => (
                <div key={msg.id} className="anim-enter">
                  {msg.role === "user" ? (
                    <div style={{ display: "flex", justifyContent: "flex-end", width: "100%", margin: "8px 0" }}>
                      <div
                        style={{
                          maxWidth: "80%",
                          backgroundColor: "var(--color-brand-600, #4f46e5)",
                          color: "#ffffff",
                          padding: "12px 16px",
                          borderRadius: "14px 14px 2px 14px",
                          fontSize: "14px",
                          lineHeight: 1.55,
                          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                          wordBreak: "break-word",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ) : (
                    <div>
                      {msg.isLoading ? (
                        <div className="card" style={{ padding: "20px", display: "flex", gap: 12, alignItems: "center" }}>
                          <Spinner />
                          <span style={{ fontSize: 13, color: "var(--color-ink-muted)" }}>Finding answer in transcripts...</span>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <span className="section-label" style={{ marginLeft: 4 }}>
                            Answer
                          </span>
                          <AnswerCard
                            answer={msg.text}
                            sourceLesson={msg.sourceLesson}
                            timestampRange={msg.timestampRange}
                            snippets={msg.snippets}
                            explanation={msg.explanation}
                            sourceUrl={msg.sourceUrl}
                            sourceType={msg.sourceType}
                            startMs={msg.startMs}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Input bar ───────────────────────────────────── */}
      <div style={s.inputBar}>
        <form onSubmit={(e) => handleSubmit(e)} style={s.form}>
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
                e.target.style.borderColor = "var(--color-brand-400)";
                e.target.style.boxShadow = "0 0 0 3px oklch(54% 0.26 270 / 0.14)";
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
