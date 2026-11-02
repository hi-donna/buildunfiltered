# Watch — the channel list

`/watch/` shows the latest videos from the channels below. The list lives in Scout
(`data/projects/watch.json`); this file records why each one is on it. Checked 2026-11-02.

**The bar:** run by the company or team that makes the tool (not a fan or reseller channel),
posted in the last 90 days, and mostly technical (demos, how-tos, talks). Channel IDs were
resolved from the handle on youtube.com; each channel's RSS feed returned 15 videos.

| Group | Channel | Handle | Channel ID | Subscribers (2 Nov 2026) |
|---|---|---|---|---|
| Labs | Anthropic | @anthropic-ai | UCrDwWp7EBBv4NwvScIpBDOA | 831K |
| Labs | Claude | @claude | UCV03SRZXJEz-hchIAogeJOg | 693K |
| Labs | OpenAI | @OpenAI | UCXZCJLdBC09xxGZ6gcdrc6A | 2.1M |
| Labs | Google DeepMind | @GoogleDeepMind | UCP7jMXSY2xbc3KCAE0MHQ-A | — |
| Labs | AI at Meta | @AIatMeta | UC5qxlwEKM7-5YZudb24l0bg | — |
| Labs | Mistral AI | @MistralAIOfficial | UC5-pBdfdA3KUo-vq72l-umA | 19.4K (linked from mistral.ai) |
| Platforms | Google for Developers | @GoogleDevelopers | UC_x5XG1OV2P6uZZ5FSM9Ttw | 2.68M |
| Platforms | Google Cloud Tech | @GoogleCloudTech | UCJS9pqu9BzkAMNTmzNMNhvg | 1.47M |
| Platforms | GitHub | @GitHub | UC7c3Kb6jYCRj4JOHHZTxKsQ | 704K |
| Platforms | Cloudflare Developers | @CloudflareDevelopers | UC3QIolTSR29ba4_u15vtEUQ | 41.6K |
| Platforms | Vercel | @VercelHQ | UCLq8gNoee7oXM7MvTdjyQvA | 19K |
| Platforms | Supabase | @Supabase | UCNTVzV1InxHV-YR0fSajqPQ | — |
| Frameworks | LangChain | @LangChain | UCC-lyoTfSrcJzA1ab3APAgw | 209K |
| Frameworks | LlamaIndex | @LlamaIndex | UCeRjipR4_SsCddq9VZ2AeKg | 28.7K |
| Frameworks | Hugging Face | @HuggingFace | UCHlNU7kIZhRgSbhHvFoy72w | 149K |
| Frameworks | Pinecone | @pinecone-io | UC02IWPisqHk2nsWfurnl-mQ | 93.9K |
| Coding tools | Cursor | @cursor_ai | UC6YYHJzM6PhZ2Yey9BQiUaw | 81.8K |
| Coding tools | Replit | @Replit | UCgoJjdR6-7AMu9fDitb6nVw | 129K |
| Coding tools | n8n | @n8n-io | UCiHVTkJtWSdc9N3h0nUGWLg | 252K |
| Talks | AI Engineer | @aiDotEngineer | UCLKPca3kwwd-B59HNr-_lvA | 953K |

## Looked at and left out

- **Ollama** — `@ollama` (6 subscribers) and `@ollama_ai` (394) aren't verifiably Ollama's; ollama.com links no channel.
- **Weights & Biases** — `@WandB` and `@weightsandbiases` are tiny unrelated channels; wandb.ai links none.
- **CrewAI** — `@crewAIInc` looks official but hasn't posted since 22 Aug 2025. `@crewai` isn't theirs.
- **OpenAI Developers** — `@OpenAIDevelopers` exists but its feed is empty.
- **Mistral** — `@MistralAI` and `@mistral-ai` are not Mistral's; the real one is `@MistralAIOfficial`.

Influencer channels from The Wire (Matthew Berman, Greg Isenberg, Riley Brown…) are out on purpose:
this tab is official channels only.

## Changing the list

Add or remove a `youtube_channel` source in Scout's `data/projects/watch.json` (or through the
Scout dashboard), then update this table. The next Scout run republishes `data/watch.json`.
