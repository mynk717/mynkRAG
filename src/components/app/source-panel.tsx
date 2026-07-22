"use client";

import { useEffect, useState, useCallback } from "react";
import { UploadBox } from "./upload-box";

interface Source {
  name: string;
  chunks: number;
  cues: number;
  status: string;
}

interface SourcePanelProps {
  onSourcesChange?: (count: number) => void;
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
    </svg>
  );
}

export function SourcePanel({ onSourcesChange }: SourcePanelProps) {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch("/api/ingest/sources");
      if (!res.ok) throw new Error("Failed to load sources");
      const data = await res.json();
      setSources(data.sources || []);
      if (onSourcesChange) {
        onSourcesChange((data.sources || []).length);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [onSourcesChange]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const totalCues = sources.reduce((a, s) => a + s.cues, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, padding: "16px 14px" }}>
      
      {/* ── Heading ──────────────────────────────────────── */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-ink-faint)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Add Knowledge
          </span>
          <button
            onClick={fetchSources}
            title="Refresh active sources"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-ink-faint)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <RefreshIcon />
          </button>
        </div>
        <div style={{ fontSize: 11, color: "var(--color-ink-muted)", marginTop: 3 }}>
          Upload transcripts to query in real time
        </div>
      </div>

      {/* Upload Widget */}
      <UploadBox onUploadSuccess={fetchSources} />

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: "var(--color-line-muted)" }} />

      {/* Indexed list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-ink-faint)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Your Library ({sources.length})
          </span>
          {sources.length > 0 && (
            <span style={{ fontSize: 10, color: "var(--color-ink-faint)" }}>
              {totalCues.toLocaleString()} segments
            </span>
          )}
        </div>

        {loading ? (
          <p style={{ fontSize: 11, color: "var(--color-ink-faint)", textAlign: "center", margin: "10px 0" }}>
            Loading sources list…
          </p>
        ) : sources.length === 0 ? (
          <div
            style={{
              padding: "16px 12px",
              borderRadius: "var(--radius-lg)",
              backgroundColor: "oklch(54% 0.26 270 / 0.03)",
              border: "1px dashed var(--color-line)",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 500, color: "var(--color-ink-muted)", margin: 0 }}>
              No subtitle files loaded yet.
            </p>
            <p style={{ fontSize: 9, color: "var(--color-ink-faint)", margin: "4px 0 0 0" }}>
              Upload an .srt or .vtt file above to query it.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {sources.map((s, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-line-muted)",
                  backgroundColor: "var(--color-surface-raised)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                  <span style={{ color: "var(--color-success)", flexShrink: 0, display: "flex", alignItems: "center" }}>
                    <CheckIcon />
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--color-ink)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={s.name}
                  >
                    {s.name}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 9,
                    color: "var(--color-ink-faint)",
                    fontFamily: "var(--font-mono)",
                    fontVariantNumeric: "tabular-nums",
                    marginLeft: 8,
                    flexShrink: 0,
                  }}
                >
                  {s.cues} segments
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      
    </div>
  );
}
