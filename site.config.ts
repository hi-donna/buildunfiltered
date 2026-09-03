// One place for the things that change when the brand does.
export const site = {
  name: "build.unfiltered",
  domain: "buildunfiltered.com",
  url: "https://buildunfiltered.com",
  tagline: "Tools for people who build things.",

  // Newsletter: set this to your provider's form POST endpoint (Buttondown,
  // ConvertKit, Kit, whatever) and the signup block appears. Left null, the
  // block stays hidden — a form that goes nowhere is worse than no form.
  newsletterAction: null as string | null,

  // The shelf on the homepage, in ship order. A tool is listed here only
  // once it is live; nothing on the shelf is "coming soon".
  tools: [
    { id: "ai-tools", name: "AI Tool Finder", href: "/ai-tools/",
      blurb: "Which AI tool to use for the job you actually have.", status: "live" },
    { id: "mcp", name: "MCP Connect", href: "/tools/mcp/",
      blurb: "Which MCP server to use, and what it gets access to.", status: "live" },
  ] as { id: string; name: string; href: string; blurb: string; status: "live" }[],
};
