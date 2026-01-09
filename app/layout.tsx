import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MDark - Markdown to PDF Converter",
  description: "A free and beautiful markdown to PDF converter with real-time preview",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
