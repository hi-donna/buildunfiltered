import type { Metadata } from "next";
import { site } from "@/site.config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s · ${site.name}` },
  description:
    "Pick the right AI tool for the job you actually have. Five ranked picks, what each costs, and the catch nobody mentions.",
  openGraph: { siteName: site.name, type: "website" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0A0A0B" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Display: Barlow Condensed. Body: Archivo. Metadata only: JetBrains Mono.
            Kalam + Caveat Brush: workshop handwriting, used only for arrows and annotations on the Learning Map. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Archivo:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Kalam:wght@300;400&family=Caveat+Brush&display=swap"
        />
      </head>
      <body>
        <header className="site-head">
          <div className="wrap head-inner">
            <a className="brand" href="/" aria-label={`${site.name} home`}>
              <span className="brand-mark" aria-hidden="true" />
              <span>build<span className="dot">.</span>unfiltered</span>
            </a>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-foot" aria-hidden="true" />
      </body>
    </html>
  );
}
