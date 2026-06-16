import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Collabrix",
  description: "Real-time collaborative coding, interviews, contests, AI feedback, video, and GitHub workflows."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
