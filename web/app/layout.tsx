import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import Providers from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-inter" });
const genshin = localFont({ src: "../assets/fonts/Genshin.woff2", variable: "--font-genshin" });

export const metadata: Metadata = {
  title: {
    template: "%s · Genshin Schedule",
    default: "Genshin Schedule",
  },
  description: "A simple app for keeping track of your resin in Genshin Impact.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
    other: { rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#5bbad5" },
  },
  appleWebApp: { capable: true },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#2e313d",
  },
};

export const viewport: Viewport = {
  themeColor: "#2e313d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // next-themes sets the class attribute before hydration
    <html lang="en" className={`${inter.variable} ${genshin.variable}`} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>

        {process.env.NODE_ENV === "production" && (
          <Script data-website-id="c976809c-8201-40e1-bed0-238345a7635f" src="https://bing.seekr.pw/chilling.js" />
        )}
      </body>
    </html>
  );
}
