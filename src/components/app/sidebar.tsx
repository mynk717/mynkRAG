"use client";

import { SourcePanel } from "./source-panel";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSourcesChange?: (count: number) => void;
}

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/>
      <path d="M19 3l.75 2.25L22 6l-2.25.75L19 9l-.75-2.25L16 6l2.25-.75z"/>
      <path d="M5 19l.75 2.25L8 22l-2.25.75L5 25l-.75-2.25L2 22l2.25-.75z"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

export function Sidebar({ isOpen, setIsOpen, onSourcesChange }: SidebarProps) {
  const sidebarStyle: React.CSSProperties = {
    position: "fixed" as const,
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 40,
    width: 300,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "var(--color-surface)",
    borderRight: "1px solid var(--color-line)",
    transition: "transform 0.2s ease-in-out, margin-left 0.2s ease-in-out",
    transform: isOpen ? "translateX(0)" : "translateX(-100%)",
  };

  return (
    <>
      <style>{`
        @media (min-width: 768px) {
          #app-sidebar {
            position: relative !important;
            transform: none !important;
            margin-left: ${isOpen ? "0px" : "-300px"} !important;
            transition: margin-left 0.2s ease-in-out !important;
          }
          #mobile-sidebar-backdrop {
            display: none !important;
          }
          #sidebar-mobile-close-btn {
            display: none !important;
          }
        }
      `}</style>

      <aside id="app-sidebar" style={sidebarStyle}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderBottom: "1px solid var(--color-line)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "var(--radius-md)",
                backgroundColor: "oklch(54% 0.26 270 / 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-brand-600)",
                flexShrink: 0,
              }}
            >
              <SparkleIcon />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-ink)", lineHeight: 1.2 }}>
                Mynk RAG
              </div>
              <div style={{ fontSize: 10, color: "var(--color-ink-faint)", marginTop: 2, lineHeight: 1 }}>
                Answers with timestamps &amp; source evidence
              </div>
            </div>
          </div>
          
          {/* Close button (always works to collapse sidebar) */}
          <button
            id="sidebar-mobile-close-btn"
            aria-label="Collapse sidebar"
            onClick={() => setIsOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: "transparent",
              color: "var(--color-ink-muted)",
              cursor: "pointer",
            }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <SourcePanel onSourcesChange={onSourcesChange} />
        </div>
      </aside>

      {/* ── Mobile backdrop overlay ───────────────────────────── */}
      {isOpen && (
        <div
          id="mobile-sidebar-backdrop"
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 30,
            backgroundColor: "oklch(0% 0 0 / 0.35)",
            backdropFilter: "blur(2px)",
          }}
        />
      )}
    </>
  );
}
