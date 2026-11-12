import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bugboard",
  description: "A small, fast bug tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <Link href="/" className="brand">🐞 Bugboard</Link>
          <Link href="/bugs/new" className="button">+ Report bug</Link>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
