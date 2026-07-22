"use client";

import { useState } from "react";

export interface AnswerCardProps {
  answer?: string;
  sourceLesson?: string;
  timestampRange?: string;
  snippets?: string[];
  explanation?: string;
}

function BookIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
function QuoteIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
    </svg>
  );
}
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition:"transform 0.2s" }}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
    </svg>
  );
}

export function AnswerCard({
  answer = "No answer available.",
  sourceLesson = "Unknown lesson",
  timestampRange = "—",
  snippets = [],
  explanation,
}: AnswerCardProps) {
  const [showEvidence, setShowEvidence] = useState(true);

  return (
    <div className="card" style={{ overflow:"hidden" }}>
      {/* Meta bar */}
      <div
        style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          flexWrap:"wrap", gap:10,
          padding:"12px 16px",
          backgroundColor:"var(--color-surface-raised)",
          borderBottom:"1px solid var(--color-line-muted)",
        }}
      >
        <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0 }}>
          <div style={{ width:24, height:24, borderRadius:"var(--radius-sm)", backgroundColor:"oklch(54% 0.26 270 / 0.12)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--color-brand-600)", flexShrink:0 }}>
            <BookIcon />
          </div>
          <span style={{ fontSize:12, fontWeight:600, color:"var(--color-ink)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {sourceLesson}
          </span>
        </div>
        <div className="badge" style={{ fontFamily:"var(--font-mono)", flexShrink:0 }}>
          <ClockIcon />
          {timestampRange}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding:"18px 18px 14px", display:"flex", flexDirection:"column", gap:18 }}>
        {/* Answer text */}
        <div style={{ display:"flex", gap:12 }}>
          <div style={{ width:22, height:22, borderRadius:"var(--radius-sm)", backgroundColor:"oklch(54% 0.26 270 / 0.10)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--color-brand-600)", fontWeight:700, fontSize:11, flexShrink:0, marginTop:1 }}>
            A
          </div>
          <p style={{ fontSize:14, fontWeight:500, color:"var(--color-ink)", lineHeight:1.7, margin:0 }}>
            {answer}
          </p>
        </div>

        {/* Transcript evidence */}
        {snippets.length > 0 && (
          <div
            style={{
              borderRadius:"var(--radius-lg)",
              border:"1px solid var(--color-line-muted)",
              overflow:"hidden",
              backgroundColor:"var(--color-surface-raised)",
            }}
          >
            {/* Collapse toggle */}
            <button
              type="button"
              onClick={() => setShowEvidence(v => !v)}
              style={{
                width:"100%",
                display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"10px 14px",
                background:"transparent",
                border:"none",
                cursor:"pointer",
                textAlign:"left",
              }}
            >
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                <span style={{ color:"var(--color-brand-500)" }}><QuoteIcon /></span>
                <span style={{ fontSize:11, fontWeight:600, color:"var(--color-ink)" }}>Transcript Evidence</span>
                <span style={{ fontSize:10, color:"var(--color-ink-faint)", backgroundColor:"var(--color-surface-muted)", border:"1px solid var(--color-line)", borderRadius:"var(--radius-full)", padding:"1px 6px" }}>
                  {snippets.length}
                </span>
              </div>
              <span style={{ color:"var(--color-ink-faint)" }}><ChevronIcon open={showEvidence} /></span>
            </button>

            {showEvidence && (
              <div style={{ borderTop:"1px solid var(--color-line-muted)", padding:"12px 14px", display:"flex", flexDirection:"column", gap:10 }}>
                {snippets.map((snippet, idx) => (
                  <div key={idx} style={{ display:"flex", gap:10 }}>
                    <span style={{ fontSize:10, fontFamily:"var(--font-mono)", color:"var(--color-ink-faint)", flexShrink:0, width:16, paddingTop:2 }}>
                      {idx + 1}.
                    </span>
                    <p style={{ fontSize:12, color:"var(--color-ink)", lineHeight:1.65, margin:0, fontStyle:"italic", borderLeft:"2px solid oklch(54% 0.26 270 / 0.35)", paddingLeft:10 }}>
                      {snippet}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Explanation */}
        {explanation && (
          <p style={{ fontSize:11, color:"var(--color-ink-muted)", lineHeight:1.7, margin:0, borderTop:"1px solid var(--color-line-muted)", paddingTop:14 }}>
            {explanation}
          </p>
        )}

        {/* Footer action */}
        <div style={{ display:"flex", justifyContent:"flex-end", borderTop:"1px solid var(--color-line-muted)", paddingTop:10 }}>
          <button
            className="btn-ghost"
            style={{ gap:6, color:"var(--color-brand-600)", borderColor:"oklch(54% 0.26 270 / 0.25)" }}
          >
            <PlayIcon />
            Jump to timestamp
          </button>
        </div>
      </div>
    </div>
  );
}
