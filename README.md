## Life Simulator RPG (Roleplay Chat Bot Game)

A Next.js-based life sim / romance RPG where you explore locations, meet NPCs, and roleplay via a narrative window and direct NPC chat. It supports AI-powered dialogue/narration (Grok) with offline fallbacks so the game is still playable without keys.

## Getting Started

First, install dependencies and run the development server:

```bash
npm ci
npm run dev
```

Open `http://localhost:3000` with your browser to play.

### How to play (MVP loop)

- **New Game** → create your character and world.
- **Narrative Window** → type actions freely or click generated choices.
- **Meet NPCs** → approach people in a location, then chat in-person (narrative) or open the dedicated chat modal from an NPC profile.
- **Travel** → open the map and move between locations (time advances on travel).
- **Time** → game time advances automatically, and respects the **speed controls** (0.5x / 1x / 2x).

### Optional AI keys

If you want AI-generated dialogue and narration:

- **Grok / xAI**: set `XAI_API_KEY` (or `NEXT_PUBLIC_XAI_API_KEY`)

See `.env.example` for the full list.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

