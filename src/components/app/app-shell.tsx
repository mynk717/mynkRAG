"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { QueryPanel } from "./query-panel";

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sourcesCount, setSourcesCount] = useState(0);

  return (
    <div
      style={{
        display: "flex",
        height: "100svh",
        width: "100vw",
        overflow: "hidden",
        backgroundColor: "var(--color-canvas)",
      }}
    >
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onSourcesChange={setSourcesCount}
      />
      <main
        style={{
          flex: 1,
          minWidth: 0,
          height: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <QueryPanel
          isSidebarOpen={sidebarOpen}
          setIsSidebarOpen={setSidebarOpen}
          hasSources={sourcesCount > 0}
        />
      </main>
    </div>
  );
}
