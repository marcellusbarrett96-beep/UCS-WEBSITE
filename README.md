# Utility Coin Scope (UCS)

A learning site for utility-oriented cryptocurrencies: what each coin does, how it's
integrating into the market, how it relates to tokenized real-world assets, and a
live-scanned feed of developments, acquisitions, settlements, and sentiment.

---

## Plain-English glossary — what all this stuff actually is

**Frontend** — the part of the website people actually see and click on in their
browser. In this project, that's everything in the `src/` folder.

**Backend** — code that runs on a server, not in the visitor's browser. Nobody can
see its code or steal secrets from it by "viewing page source." In this project,
that's the `api/` folder.

**Component** — a reusable chunk of a webpage's UI, written as a function. `App.jsx`
is the main component; it's built out of smaller ones like `NewsPanel`.

**React** — the toolkit this site's frontend is built with. It lets you describe
what the page should look like, and it handles updating the page when data changes.

**Vite** — the tool that takes your React code (which browsers can't run directly)
and turns it into plain HTML/CSS/JavaScript files a browser *can* run. Also gives
you a fast local preview server while you're building.

**npm / package.json** — `npm` is a program that downloads and installs code other
people wrote (called "packages" or "dependencies") so you don't have to write
everything from scratch. `package.json` is the list of which packages your project
needs.

**Dependency** — someone else's code your project relies on (e.g., React itself).

**API (Application Programming Interface)** — a defined way for one piece of
software to ask another for information. This site's frontend calls *your own*
backend API (`/api/claude`), which in turn calls Anthropic's API.

**API key** — like a password that proves a request is allowed to use a paid
service. Your Anthropic API key must **never** appear in frontend code, because
anyone can open a browser's dev tools and read frontend code. That's why it lives
only in the backend, as an environment variable.

**Environment variable** — a secret or setting stored outside your code (so it's
never committed to GitHub or visible to visitors), and read by the server at
runtime. `ANTHROPIC_API_KEY` is one.

**Serverless function** — a small backend function (like `api/claude.js`) that a
hosting provider (Vercel) automatically runs on-demand when it's called, without
you having to manage an actual server. You just write the function; Vercel handles
the rest.

**Repository ("repo")** — a project folder tracked by Git, usually hosted on
GitHub, so you have version history and can deploy from it.

**Git / GitHub** — Git tracks changes to your code over time. GitHub is a website
that hosts Git repositories online (and is what Vercel connects to for deploys).

**Build** — the process of converting your source code into the optimized files a
browser actually downloads and runs (`npm run build`, producing a `dist/` folder).

**Deploy** — publishing your built site to a live server on the internet so the
public can visit it.

**DNS (Domain Name System)** — the system that translates a human-readable domain
name (`utilitycoinscope.com`) into the actual server address it should load from.
Pointing your domain at Vercel means adding a couple of DNS records your domain
registrar gives you a form for.

**localStorage** — a small amount of storage built into every browser. This
starter project uses it so each visitor's coin list is remembered on *their own*
device. It is **not** shared between visitors — see "Next steps" below if you want
one shared list everyone sees.

---

## Project structure

```
ucs-website/
├── api/
│   └── claude.js       ← backend: privately calls Anthropic's API
├── src/
│   ├── App.jsx          ← the whole app UI
│   ├── main.jsx          ← boots React
│   └── index.css          ← styling setup (Tailwind + fonts)
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example
└── .gitignore
```

## Running it on your own computer first

1. Install [Node.js](https://nodejs.org) (the LTS version) if you don't have it.
2. Open a terminal in this folder and run:
   ```
   npm install
   ```
   (downloads all the dependencies)
3. Copy `.env.example` to `.env.local` and paste in your real Anthropic API key.
   Get a key at [console.anthropic.com](https://console.anthropic.com) if you don't
   have one — you'll need a billing method attached, since API usage is metered
   separately from any Claude.ai subscription.
4. Run:
   ```
   npm run dev
   ```
   This starts a local preview, usually at `http://localhost:5173`. Note: the
   `/api/claude` route only works when deployed to Vercel (see below) or when
   running Vercel's own local dev tool (`vercel dev`) — plain `npm run dev` will
   serve the frontend but the API calls will fail locally unless you use `vercel dev`.

## Putting it on GitHub

1. Create a free account at [github.com](https://github.com) if you don't have one.
2. Create a new empty repository (no README/license, since you already have these files).
3. In this project folder, run:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-repo-url-from-github>
   git push -u origin main
   ```

## Deploying it live (Vercel)

1. Go to [vercel.com](https://vercel.com) and sign up (free tier is enough to start).
2. Click "Add New Project" and import the GitHub repo you just pushed.
3. Vercel will detect it's a Vite project automatically — leave the defaults.
4. Before deploying, add your environment variable: Project Settings → Environment
   Variables → add `ANTHROPIC_API_KEY` with your real key as the value.
5. Click Deploy. Vercel gives you a free `yourproject.vercel.app` URL immediately.

## Attaching your own domain

1. Buy a domain from a registrar (Namecheap, Cloudflare, Google Domains' successor
   Squarespace Domains, etc.) — typically $10–20/year.
2. In your Vercel project → Settings → Domains, add your domain.
3. Vercel shows you exactly which DNS records to add. Log into your registrar,
   paste those records in (usually an "A" record or "CNAME"), and wait — DNS
   changes can take a few minutes to a few hours to take effect.

## Ownership

Everything in this folder is code you own — copyright applies automatically the
moment it's written, no filing needed. If you want the *name* "Utility Coin
Scope"/"UCS" legally protected from others using it, that's a trademark filing
(state or USPTO), which is a separate, optional step from just owning the code —
worth a quick conversation with a lawyer if you want to pursue it, since I'm not
one and can't advise on strategy there.

## Next steps you might want

- **Shared data for all visitors**: right now each visitor's browser has its own
  coin list (via `localStorage`). If you want one list everyone sees and edits
  together, swap the storage functions in `App.jsx` for calls to a real database
  (Supabase and Firebase both have generous free tiers and are relatively
  beginner-friendly).
- **Rate limiting**: since your API key is metered/billed by usage, consider adding
  basic rate limiting to `api/claude.js` if the site gets public traffic, so one
  visitor can't rack up unexpected costs by refreshing repeatedly.
- **Custom favicon/branding**: drop a `favicon.ico` into `public/` and reference it
  in `index.html`.
