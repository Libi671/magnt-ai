import type { Metadata } from "next";
import "./globals.css";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://magnt.ai';

export const metadata: Metadata = {
  title: "Magnt.AI - אתגרי שיווק מבוססי AI",
  description: "פלטפורמת אתגרי שיווק מבוססת AI לאיסוף לידים וחימום",
  openGraph: {
    title: "Magnt.AI - אתגרי שיווק מבוססי AI",
    description: "פלטפורמת אתגרי שיווק מבוססת AI לאיסוף לידים וחימום",
    images: [
      {
        url: `${baseUrl}/logo.png`,
        width: 1200,
        height: 630,
        alt: "Magnt.AI",
      },
    ],
    type: "website",
    locale: "he_IL",
    siteName: "Magnt.AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Magnt.AI - אתגרי שיווק מבוססי AI",
    description: "פלטפורמת אתגרי שיווק מבוססת AI לאיסוף לידים וחימום",
    images: [`${baseUrl}/logo.png`],
  },
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
