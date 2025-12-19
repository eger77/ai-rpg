import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Life Simulator RPG - Romance & Relationship Game",
  description: "Build relationships, pursue your dreams, and live your story in this immersive life simulation RPG with dynamic AI characters.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
