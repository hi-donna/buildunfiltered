import type { Metadata } from "next";
import McpList from "@/components/McpList";
import Newsletter from "@/components/Newsletter";
import {
  mcpCategories, mcpTargets, mcpPreamble, mcpMethod, mcpGenerated,
  readOnlyAvailable, noKeyNeeded, isRemote,
} from "@/lib/mcp";

export const metadata: Metadata = {
  title: "MCP Connect",
  description:
    "Which MCP server to use for each thing you want your AI to reach — whether it's the vendor's own, what it can read, write and delete, and which servers to avoid.",
  alternates: { canonical: "/tools/mcp/" },
};

export default function McpIndex() {
  // Facets computed here, once, from the data. The client only filters.
  const facets = Object.fromEntries(
    mcpTargets.map((t) => [t.id, {
      official: t.pick.official,
      readonly: readOnlyAvailable(t),
      nokey: noKeyNeeded(t),
      remote: isRemote(t),
    }])
  );

  return (
    <div className="wrap finder">
      <h1 className="finder-title">MCP Connect</h1>
      <p className="finder-lede">
        {mcpTargets.length} things you might connect. One server each, who maintains it, and what it can touch.
      </p>

      <details className="preamble" open>
        <summary>
          <span className="preamble-title">{mcpPreamble.title}</span>
          <span className="preamble-hint" aria-hidden="true" />
        </summary>
        <ol className="preamble-points">
          {mcpPreamble.points.map((p) => <li key={p}>{p}</li>)}
        </ol>
        <div className="srcs preamble-srcs">
          {mcpPreamble.sources.map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noopener">{s.label}</a>
          ))}
        </div>
      </details>

      <McpList groups={mcpCategories} facets={facets} />

      <section className="sub method" id="method">
        <h2>How we picked</h2>
        <dl className="meta">
          <div><dt>The method</dt><dd>{mcpMethod.how}</dd></div>
          <div><dt>What we did not do</dt><dd>{mcpMethod.tested_on}</dd></div>
          <div><dt>Conflicts of interest</dt><dd>{mcpMethod.conflicts}</dd></div>
          <div><dt>Last checked</dt><dd>{mcpGenerated}</dd></div>
        </dl>
      </section>

      <Newsletter />
    </div>
  );
}
