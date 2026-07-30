<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/5ed6d4cb-d6e9-4e96-b510-9cd781dacfe7

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy [.env.example](.env.example) to `.env.local` and fill it in. Care IA needs
   `ANTHROPIC_API_KEY`; the rest configures Firebase.
3. Run the app:
   `npm run dev`

## Care IA

The assistant runs on Claude (`claude-opus-5`). The API key stays server-side —
the browser only talks to our own Express routes:

| Route | What it does |
| --- | --- |
| `POST /api/ai/chat` | Streams the medical coach's reply as Server-Sent Events |
| `POST /api/ai/interactions` | Returns a structured drug-interaction report |

Both routes are rate-limited to 50 requests per 15 minutes per IP.
