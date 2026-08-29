import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { site } from "@/site.config";

// The social card. Same palette and type pairing as the site itself
// (see globals.css :root) so a shared link looks like the page it opens.
// output: "export" needs every route pinned static, this one included.
export const dynamic = "force-static";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${site.name} — ${site.tagline}`;

const PAPER = "#F3F5F4";
const INK = "#171B1A";
const MUTED = "#5C6764";
const RULE = "#D7DEDB";
const ACCENT = "#1E5F4E";

// satori can't resolve a webfont from a CSS link, so the files are vendored
// in app/_og-fonts (underscore = Next won't route it). Both are OFL.
const font = (f: string) => readFileSync(join(process.cwd(), "app", "_og-fonts", f));

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: PAPER,
          color: INK,
          padding: "72px 80px",
          fontFamily: "Karla",
        }}
      >
        {/* brand */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", fontFamily: "Newsreader", fontSize: 40 }}>
            <span>build</span>
            <span style={{ color: ACCENT }}>.</span>
            <span>unfiltered</span>
          </div>
        </div>

        {/* the site's actual H1 */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Newsreader",
              fontSize: 96,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              maxWidth: 940,
            }}
          >
            Tools for people who build things.
          </div>
          <div style={{ display: "flex", height: 3, width: 132, background: ACCENT, marginTop: 40 }} />
        </div>

        {/* footer rule */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", height: 1, width: "100%", background: RULE, marginBottom: 22 }} />
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            <div style={{ display: "flex", fontSize: 22, fontWeight: 700, letterSpacing: "0.14em", color: MUTED }}>
              AI TOOL FINDER
            </div>
            <div style={{ display: "flex", fontSize: 22, fontWeight: 700, letterSpacing: "0.04em", color: MUTED }}>
              {site.domain}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Newsreader", data: font("Newsreader-Medium.ttf"), weight: 500, style: "normal" },
        { name: "Karla", data: font("Karla-Bold.ttf"), weight: 700, style: "normal" },
      ],
    }
  );
}
