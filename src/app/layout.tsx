import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Magnt.AI - אתגרי שיווק מבוססי AI",
  description: "פלטפורמת אתגרי שיווק מבוססת AI לאיסוף לידים וחימום",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body>
        {children}
      </body>
    </html>
  );
}
