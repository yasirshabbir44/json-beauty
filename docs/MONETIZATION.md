# Monetization & sustainability

JSON Beauty uses a **free-first, sponsorship-friendly** model that matches its privacy promise (100% client-side processing).

## Current approach

- **No paywalls** — core editing, validation, conversion, compare, and share stay free.
- **Optional tips** — configure one-time or recurring links in `src/app/constants/sponsorship.constants.ts`:
  - `buyMeACoffeeUrl` — e.g. `https://buymeacoffee.com/yourusername`
  - `githubSponsorsUrl` — e.g. `https://github.com/sponsors/yourusername`
- **Support page** — `/support` explains ways to help and shows a **Pro roadmap** (coming soon), not a checkout flow.
- **Footer & settings** — links to `/support`, GitHub star, and any configured sponsor URLs.

## Pro tier (planned, not implemented)

A future Pro plan is documented on `/support` for transparency. Likely differentiators (require backend / accounts):

| Area | Free (today) | Pro (planned) |
|------|----------------|----------------|
| Processing | Browser-only | Same + optional cloud sync |
| Share | Static URL | Live collaboration |
| History | Local storage | Unlimited + sync |
| API | — | REST automation |
| Converters | YAML, XML, CSV, JSON5 | Additional formats |

Implementing Pro would need authentication, billing (e.g. Stripe), and infrastructure — separate from the static SPA.

## Enabling Buy Me a Coffee

1. Open `src/app/constants/sponsorship.constants.ts`.
2. Set `buyMeACoffeeUrl` to your profile URL.
3. Rebuild and deploy — the footer and `/support` page show the button automatically.

Tips never unlock features or change client-side behavior.
