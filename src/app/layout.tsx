import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "RAAHI — Know the road before you hit it",
  description:
    "RAAHI is a community-reported road-hazard map for Indian roads. See potholes, debris and construction ahead, get spoken warnings while you drive, and route around danger — powered by live spatial data.",
};

// Runs before paint to set the theme with no flash.
// Mode: 'auto' (day=light, night=dark, like Google Maps) | 'light' | 'dark'.
const themeScript = `
(function () {
  try {
    var mode = localStorage.getItem('raahi-theme') || 'light';
    var theme = mode;
    if (mode === 'auto') {
      var h = new Date().getHours();
      theme = (h >= 19 || h < 6) ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${body.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
