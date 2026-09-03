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

  // The homepage shelf renders from this list, in ship order. Route is
  // /tools/<slug>/ unless `href` says otherwise (the finder keeps its indexed
  // URL). Only "live" tools get a card.
  tools: [
    { slug: "ai-finder", name: "AI Tool Finder", href: "/ai-tools/",
      blurb: "Which AI tool to use for the job you actually have.", status: "live" },
    { slug: "mcp", name: "MCP Connect",
      blurb: "Which MCP server to use, and what it gets access to.", status: "live" },
    { slug: "learn", name: "Learning Map",
      blurb: "31 things to understand before you build on an LLM, in the order they depend on each other.", status: "live" },
  ] as { slug: string; name: string; href?: string; blurb: string; status: "live" | "building" | "planned" }[],
};
