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
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500&family=Karla:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>
        <header className="site-head">
          <div className="wrap head-inner">
            <a className="brand" href="/">
              build<span className="dot">.</span>unfiltered
            </a>
            <span className="brand-note">Tools for people who build things</span>
          </div>
        </header>
        {children}
        <footer className="site-foot">
          <div className="wrap">
            <p>
              {site.name} — built in the open. Rankings are opinions with dates on them;
              when we haven&apos;t done the work, the page says so.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
