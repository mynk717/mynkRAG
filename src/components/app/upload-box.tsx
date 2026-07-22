"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";

interface UploadBoxProps {
  onUploadSuccess: () => void;
}

export function UploadBox({ onUploadSuccess }: UploadBoxProps) {
  const [uploadMode, setUploadMode] = useState<"files" | "folder" | "youtube">("files");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, currentName: "" });

  // Dev Ingest states
  const [showDevIngest, setShowDevIngest] = useState(false);
  const [folderPath, setFolderPath] = useState("");
  const [devScanning, setDevScanning] = useState(false);
  const [devIndexing, setDevIndexing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelection = (filesList: FileList | null) => {
    if (!filesList) return;
    const filesArray = Array.from(filesList);
    const validFiles = filesArray.filter(file => {
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
      return ext === ".srt" || ext === ".vtt";
    });

    if (validFiles.length === 0) {
      toast.error("No valid .srt or .vtt subtitle files were selected.");
      return;
    }

    setSelectedFiles(validFiles);
    toast.success(`Selected ${validFiles.length} subtitle file(s) for ingestion.`);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    let successCount = 0;
    const total = selectedFiles.length;

    for (let i = 0; i < total; i++) {
      const file = selectedFiles[i];
      setUploadProgress({ current: i + 1, total, currentName: file.name });

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/ingest/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Failed to upload ${file.name}`);
        successCount++;
      } catch (err: any) {
        console.error(err);
        toast.error(`Error on "${file.name}": ${err.message || "Failed"}`);
      }
    }

    toast.success(`Indexing complete: successfully uploaded ${successCount} of ${total} files.`);
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (folderInputRef.current) folderInputRef.current.value = "";
    onUploadSuccess();
    setUploading(false);
  };

  const handleYoutubeIngest = async () => {
    const url = youtubeUrl.trim();
    if (!url) {
      toast.error("Please enter a valid YouTube URL");
      return;
    }

    setUploading(true);
    try {
      const res = await fetch("/api/ingest/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process YouTube URL");

      toast.success(
        `"${data.summary.lessonName}" added — ${data.summary.totalCuesIndexed} segments across ${data.summary.totalChunksIndexed} searchable chunks.`
      );
      setYoutubeUrl("");
      onUploadSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to ingest YouTube video captions");
    } finally {
      setUploading(false);
    }
  };

  // Local folder ingest functions for Dev Tools
  const handleFolderIngest = async () => {
    if (!folderPath.trim()) {
      toast.error("Please enter a valid folder path");
      return;
    }
    setDevScanning(true);
    try {
      const res = await fetch("/api/ingest/folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderPath: folderPath.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to ingest folder");
      toast.success(
        `Folder scan complete — found ${data.summary.totalFilesFound} files.`
      );
    } catch (err: any) {
      toast.error(err.message || "Folder scan failed");
    } finally {
      setDevScanning(false);
    }
  };

  const handleStartIndexing = async () => {
    if (!folderPath.trim()) {
      toast.error("Please enter a valid folder path");
      return;
    }
    setDevIndexing(true);
    try {
      const res = await fetch("/api/ingest/folder/index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderPath: folderPath.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to index");
      toast.success(
        `Indexed ${data.summary.processedCount} lessons into database.`
      );
      onUploadSuccess();
    } catch (err: any) {
      toast.error(err.message || "Indexing failed");
    } finally {
      setDevIndexing(false);
    }
  };

  const busy = uploading;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      
      {/* ── Mode selector ─────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          backgroundColor: "var(--color-surface-muted)",
          padding: 3,
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-line-muted)",
        }}
      >
        <button
          onClick={() => {
            setUploadMode("files");
            setSelectedFiles([]);
          }}
          style={{
            flex: 1,
            fontSize: 10,
            fontWeight: 600,
            padding: "6px 0",
            borderRadius: "var(--radius-sm)",
            border: "none",
            cursor: "pointer",
            backgroundColor: uploadMode === "files" ? "var(--color-surface)" : "transparent",
            color: uploadMode === "files" ? "var(--color-ink)" : "var(--color-ink-faint)",
            transition: "all 0.15s",
          }}
        >
          Files
        </button>
        <button
          onClick={() => {
            setUploadMode("folder");
            setSelectedFiles([]);
          }}
          style={{
            flex: 1,
            fontSize: 10,
            fontWeight: 600,
            padding: "6px 0",
            borderRadius: "var(--radius-sm)",
            border: "none",
            cursor: "pointer",
            backgroundColor: uploadMode === "folder" ? "var(--color-surface)" : "transparent",
            color: uploadMode === "folder" ? "var(--color-ink)" : "var(--color-ink-faint)",
            transition: "all 0.15s",
          }}
        >
          Folder
        </button>
        <button
          onClick={() => {
            setUploadMode("youtube");
            setSelectedFiles([]);
          }}
          style={{
            flex: 1,
            fontSize: 10,
            fontWeight: 600,
            padding: "6px 0",
            borderRadius: "var(--radius-sm)",
            border: "none",
            cursor: "pointer",
            backgroundColor: uploadMode === "youtube" ? "var(--color-surface)" : "transparent",
            color: uploadMode === "youtube" ? "var(--color-ink)" : "var(--color-ink-faint)",
            transition: "all 0.15s",
          }}
        >
          YouTube
        </button>
      </div>

      {/* ── Files / Folder Mode Upload Area ──────────────── */}
      {(uploadMode === "files" || uploadMode === "folder") && (
        <div
          onClick={() => {
            if (uploadMode === "files") {
              fileInputRef.current?.click();
            } else {
              folderInputRef.current?.click();
            }
          }}
          style={{
            border: "2px dashed var(--color-line)",
            borderRadius: "var(--radius-lg)",
            backgroundColor: "var(--color-surface)",
            padding: "24px 16px",
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.15s ease-in-out",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--color-brand-300)";
            e.currentTarget.style.backgroundColor = "var(--color-surface-raised)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--color-line)";
            e.currentTarget.style.backgroundColor = "var(--color-surface)";
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileSelection(e.target.files)}
            accept=".srt,.vtt"
            multiple
            style={{ display: "none" }}
          />

          <input
            type="file"
            ref={folderInputRef}
            onChange={(e) => handleFileSelection(e.target.files)}
            accept=".srt,.vtt"
            multiple
            {...{
              webkitdirectory: "",
              directory: "",
            }}
            style={{ display: "none" }}
          />

          <div style={{ color: "var(--color-brand-500)", marginBottom: 8 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto" }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>

          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-ink)", margin: 0 }}>
            {uploadMode === "files" ? "Choose subtitle file(s)" : "Select a subtitle folder"}
          </p>
          <p style={{ fontSize: 10, color: "var(--color-ink-faint)", margin: "4px 0 0 0" }}>
            {uploadMode === "files"
              ? "Supports one or multiple .srt / .vtt files"
              : "Recursively uploads all .srt / .vtt files in folder"}
          </p>
        </div>
      )}

      {/* ── YouTube Mode Ingestion Area ──────────────────── */}
      {uploadMode === "youtube" && (
        <div
          className="card"
          style={{
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            backgroundColor: "var(--color-surface)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "red" }}>
              <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
              <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
            </svg>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-ink)" }}>
              YouTube Subtitle Ingestion
            </span>
          </div>

          <input
            className="input-base"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="Paste video URL (e.g. https://youtu.be/...)"
            disabled={busy}
            style={{ fontSize: 11, height: 32 }}
          />

          <button
            onClick={handleYoutubeIngest}
            disabled={busy || !youtubeUrl.trim()}
            className="btn-brand"
            style={{
              width: "100%",
              height: 32,
              fontSize: 11,
              backgroundColor: "red",
              cursor: (busy || !youtubeUrl.trim()) ? "not-allowed" : "pointer",
            }}
          >
            {busy ? "Fetching & Indexing…" : "Index YouTube Transcript"}
          </button>
        </div>
      )}

      {/* Selected Files Progress Panel */}
      {selectedFiles.length > 0 && (uploadMode === "files" || uploadMode === "folder") && (
        <div
          style={{
            padding: 12,
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--color-surface-raised)",
            border: "1px solid var(--color-line)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-ink)" }}>
              {selectedFiles.length} file(s) selected
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFiles([]);
                if (fileInputRef.current) fileInputRef.current.value = "";
                if (folderInputRef.current) folderInputRef.current.value = "";
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-ink-faint)",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: "bold",
              }}
            >
              Clear
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: 60, overflowY: "auto" }}>
            {selectedFiles.slice(0, 3).map((f, i) => (
              <span key={i} style={{ fontSize: 10, color: "var(--color-ink-muted)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                · {f.name}
              </span>
            ))}
            {selectedFiles.length > 3 && (
              <span style={{ fontSize: 9, color: "var(--color-ink-faint)", fontStyle: "italic" }}>
                …and {selectedFiles.length - 3} more files
              </span>
            )}
          </div>

          {uploading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--color-brand-600)", fontWeight: 600 }}>
                <span>Uploading {uploadProgress.current} / {uploadProgress.total}</span>
                <span>{Math.round((uploadProgress.current / uploadProgress.total) * 100)}%</span>
              </div>
              <div style={{ fontSize: 9, color: "var(--color-ink-faint)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                {uploadProgress.currentName}
              </div>
              <div style={{ height: 4, width: "100%", backgroundColor: "var(--color-line-muted)", borderRadius: 2, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                    backgroundColor: "var(--color-brand-500)",
                    transition: "width 0.2s ease",
                  }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="btn-brand"
            style={{ width: "100%", height: 32, fontSize: 11 }}
          >
            {uploading ? "Uploading & Indexing…" : "Upload & Index List"}
          </button>
        </div>
      )}

      {/* ── Local Folder Ingest (Dev-only: hidden in production) ─── */}
      {process.env.NODE_ENV === "development" && (
        <div style={{ borderTop: "1px solid var(--color-line-muted)", paddingTop: 10 }}>
          <button
            onClick={() => setShowDevIngest(!showDevIngest)}
            style={{
              background: "none",
              border: "none",
              width: "100%",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 10,
              fontWeight: 600,
              color: "var(--color-ink-faint)",
              cursor: "pointer",
              padding: "4px 0",
            }}
          >
            <span>Dev tools</span>
            <span>{showDevIngest ? "▼" : "▶"}</span>
          </button>

          {showDevIngest && (
            <div
              className="card"
              style={{
                padding: 10,
                marginTop: 6,
                backgroundColor: "var(--color-surface-raised)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                borderStyle: "dashed",
              }}
            >
              <p style={{ fontSize: 9, color: "var(--color-ink-muted)", margin: 0 }}>
                Specify a local server-side directory to index multiple files at once.
              </p>
              <input
                className="input-base"
                style={{ fontFamily: "var(--font-mono)", fontSize: 10, height: 28 }}
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                placeholder="Absolute server folder path..."
                disabled={devScanning || devIndexing}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <button
                  className="btn-ghost"
                  style={{ height: 26, fontSize: 10, padding: 0 }}
                  onClick={handleFolderIngest}
                  disabled={devScanning || devIndexing}
                >
                  {devScanning ? "Scanning…" : "Scan Directory"}
                </button>
                <button
                  className="btn-brand"
                  style={{ height: 26, fontSize: 10, padding: 0 }}
                  onClick={handleStartIndexing}
                  disabled={devScanning || devIndexing}
                >
                  {devIndexing ? "Indexing…" : "Parse & Index"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
