import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "U1 Organism | Instinctive Intelligence", description: "An adaptive intelligence organism by Unmute1AI. Intelligence recommends. Authority decides." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
