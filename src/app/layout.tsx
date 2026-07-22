import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mynk RAG — Ask Your Course Transcripts",
  description:
    "Ask any question about your course recordings and get precise answers with timestamps and source evidence. Powered by Mynk RAG.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
