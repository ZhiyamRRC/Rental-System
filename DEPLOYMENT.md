# Deployment Guide

This app is **Next.js 16 + MySQL**: a live Node server with API routes, admin
panel, and a database connection. Two fully supported ways to deploy it:

| Option | Best for | Jump to |
|---|---|---|
| **A — Traditional hosting** | Hostinger / cPanel "Setup Node.js Application" (Passenger) | [below](#option-a--traditional-hosting-cpanel--shared-node-hosting) |
| **B — Docker** | Any VPS, Coolify/Dokploy/CapRover, or local development | [below](#-option-b--docker-any-vps-coolifydokploycaprover-or-local) |

Both share the same codebase, the same MySQL schema and the same
`public/img` + `public/uploads` image layout — pick whichever suits the host.

---

## Option A — Traditional hosting (cPanel / shared Node hosting)

The app *cannot* run on pure PHP/static shared hosting — but most modern cPanel
hosts let you create a **Node.js Application** (CloudLinux Node Selector /
Phusion Passenger), and that runs it perfectly.

Good news: you already picked **MySQL**, which every cPanel host includes.

---

## 🐳 Option B — Docker (any VPS, Coolify/Dokploy/CapRover, or local)

Everything needed ships with the project: `Dockerfile`, `docker-compose.yml`,
`docker-compose.dev.yml`, `.dockerignore`, `docker/entrypoint.sh` and
`.env.docker.example`.

### Quick start

```bash
cp .env.docker.example .env.docker     # set passwords + admin account
docker compose --env-file .env.docker up -d --build
```

That starts two containers:

| Service | What it does |
|---|---|
| `db`  | MySQL 8.4, utf8mb4, data in the `db_data` volume, health-checked |
| `app` | The Next.js app on `http://localhost:3000` (`APP_PORT` to change) |

On first boot the entrypoint waits for MySQL, creates the schema, seeds the
starter fleet/blog/admin, then starts the server. Re-running is safe — the
init step is idempotent and never overwrites existing data.

```bash
docker compose logs -f app      # follow logs
docker compose ps               # health status
docker compose down             # stop (data volumes are kept)
docker compose down -v          # stop AND delete the database + uploads
```

### Images and persistence

* `public/img` (the 10 default images) is **baked into the image** and verified
  during build — a fresh container always has working visuals.
* `public/uploads` is mounted as the **`uploads` volume**, so admin-uploaded
  photos survive rebuilds, redeploys and image upgrades.
* `sharp` is installed in the runtime layer so `next/image` optimisation works.
  Set `NEXT_IMAGES_UNOPTIMIZED=true` to bypass it on very small hosts.

### Explicit SQL migrations (optional)

The entrypoint uses the app's idempotent `CREATE TABLE IF NOT EXISTS`
bootstrap. To apply the versioned Drizzle migrations in `drizzle/` instead:

```bash
docker compose --profile tools run --rm migrate
```

### Development with hot reload

```bash
docker compose -f docker-compose.dev.yml up
```

Source is bind-mounted; `node_modules` and `.next` stay in container volumes so
Linux-native binaries never clash with your host.

### Notes

* The image is Debian **bookworm-slim (glibc)**, not Alpine — Next.js SWC and
  sharp ship prebuilt glibc binaries, which avoids musl-only failures.
* Low-memory build machine? Build with Webpack:
  `NEXT_BUILD_BUNDLER=webpack docker compose up -d --build`
* The container runs as the non-root `node` user and exposes a `HEALTHCHECK`
  against `/api/health`, so orchestrators can restart it automatically.
* Secrets are never baked in: `.env` / `.env.local` are excluded by
  `.dockerignore`; pass configuration via `--env-file` or your platform's
  environment settings.

---

## ⚡ Hostinger: fix for "Turbopack Panic / Failed to write app endpoint"

If Hostinger's builder panics with:

```
TurbopackInternalError: Failed to write app endpoint /icon.svg/route
… creating new process — node process exited before we could connect to it
```

…that's their build container killing Turbopack's PostCSS worker processes
(RAM/process limits). **The fix is one line**: in Hostinger → *Website →
Dashboard → your app → Environment variables* (or the project's `.env`) add:

```
NEXT_BUILD_BUNDLER=webpack
```

and rebuild. `npm run build` auto-switches to Webpack, which runs the CSS
pipeline in-process and survives those limits. Output, routes and runtime are
identical — only the bundler changes.

*(Leave that variable unset locally to keep the faster Turbopack build.)*

---

## 0. What you need

- A hosting plan with **Node.js support** (cPanel → *Setup Node.js Application*,
  or your host's Node Selector). Hostinger Business/Cloud, Namecheap (Ultimate),
  A2, GreenGeeks, and most reseller cPanel plans include it. If your control
  panel doesn't mention Node.js anywhere, this app won't run there.
- A **MySQL database** (cPanel → *MySQL Database Wizard*).
- **SSH/Terminal access** (cPanel → *Terminal*) — strongly recommended.

---

## 1. Create the database

In cPanel: **MySQL Database Wizard**

1. Name it, e.g. `bikerent` — shared hosts prefix it, so it becomes
   `username_bikerent`.
2. Create a user + strong password (e.g. `username_bikeadm`).
3. Add the user to the database with **ALL PRIVILEGES**.

Jot down: DB name, user, password, host (usually `localhost`), port (3306).

---

## 2. Put the code on the server

**Important:** upload/extract from the project root and include the entire
`public/` directory. A valid archive contains at least:

```text
public/img/hero.jpg
public/img/about.jpg
public/img/permit.jpg
public/img/cta.jpg
public/img/bikes/*.jpg
public/uploads/.gitkeep
```

`npm run build` validates this bundle and stops with a clear list if anything
is missing, so an incomplete ZIP cannot silently deploy with broken images.
Do **not** set the hosting output directory to `public/`; this is a Node/Next
application and `public/` must remain beside `.next`, `server.js` and
`package.json` at runtime.

Easiest (SSH/Terminal):

```bash
cd ~/nodeapps            # any folder OUTSIDE public_html
git clone <your-repo> bikerent          # or upload a ZIP and unzip it
cd bikerent
```

Without Git/SSH, cPanel → *File Manager* → upload a ZIP of the project → Extract.

To create a safe Hostinger ZIP from the project root, run:

```bash
node scripts/create-deployment-zip.js
```

It creates `bike-rental-hostinger.zip`, validates and includes the complete
`public/img/` default bundle, keeps `public/uploads/.gitkeep`, and excludes
secrets, `node_modules`, `.next`, Git metadata and runtime-uploaded media.

---

## 3. Environment variables

Create `.env` in the project root (cPanel File Manager → Edit, or `nano .env`):

```env
# MySQL — either one URL...
MYSQL_URL="mysql://username_bikeadm:PASSWORD@localhost:3306/username_bikerent"

# ...or granular (used if MYSQL_URL absent)
DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="username_bikerent"
DB_USER="username_bikeadm"
DB_PASSWORD="PASSWORD"
# DB_SSL="true"    # only if your host requires SSL for MySQL

# First admin login (used once, to create your account)
ADMIN_EMAIL="you@yourdomain.com"
ADMIN_PASSWORD="change-this-strong-password"
ADMIN_NAME="Royal Windsor Rental"
```

> The app honours `MYSQL_URL` first, so it works even on hosts that inject
> their own `DATABASE_URL`.

### Automatic booking notifications to WhatsApp

The app uses Meta's official WhatsApp Cloud API. In **Meta for Developers →
Your App → WhatsApp → API Setup**, obtain a sending **Phone Number ID** and a
permanent **System User token** with `whatsapp_business_messaging` permission.

Add these to `.env`:

```env
WHATSAPP_PHONE_NUMBER_ID="123456789012345"
WHATSAPP_ACCESS_TOKEN="permanent-system-user-token"
WHATSAPP_ADMIN_TO="94771234567"       # owner/admin recipient, E.164 digits
WHATSAPP_TEMPLATE_NAME="new_booking_admin"
WHATSAPP_TEMPLATE_CONFIRMED="booking_confirmed_customer"
WHATSAPP_TEMPLATE_DECLINED="booking_declined_customer"
WHATSAPP_TEMPLATE_LANGUAGE="en_US"
WHATSAPP_GRAPH_VERSION="v23.0"
```

**Two-way flow**

| Event | Who is messaged | Template |
|---|---|---|
| Customer submits a booking | **Admin** (`WHATSAPP_ADMIN_TO`) | `WHATSAPP_TEMPLATE_NAME` |
| Admin sets status **Confirmed** | **Customer** (phone on the booking) | `WHATSAPP_TEMPLATE_CONFIRMED` |
| Admin sets status **Cancelled** | **Customer** (phone on the booking) | `WHATSAPP_TEMPLATE_DECLINED` |

Create and get approval for a **Utility** template named
`new_booking_admin` with these seven body variables, in this exact order:

```text
🏍️ New booking {{1}}
Customer: {{2}}
Phone: {{3}}
Ride: {{4}}
Dates: {{5}}
Pickup: {{6}}
Total: {{7}}
```

The app fills them as: reference, customer name, customer phone, bike, date
range, pickup location, and total. Because a new website booking starts a new
conversation, Meta requires an approved template. If no template is configured,
the app attempts a normal text message (which Meta only permits in an open
24-hour conversation window).

Also create the two **customer** templates:

`booking_confirmed_customer` — 6 variables
(name, reference, bike, dates, pickup location, total):

```text
✅ Hi {{1}}, your booking {{2}} is confirmed!
Ride: {{3}}
Dates: {{4}}
Pickup: {{5}}
Total: {{6}} payable at pickup.
Bring your passport, licence and IDP. See you soon!
```

`booking_declined_customer` — 5 variables
(name, reference, bike, dates, contact phone):

```text
Hi {{1}}, sorry — booking {{2}} could not be confirmed.
Ride: {{3}}
Requested: {{4}}
Nothing was charged. Call {{5}} and we'll find you another ride.
```

Every attempt is stored on the booking. Admin → Bookings shows **WhatsApp
sent / failed / setup needed** and offers a manual retry. A WhatsApp failure
never loses the booking.

---

## 4. Install, migrate, build

In the project folder:

```bash
npm ci                                  # install exact versions from lockfile
npx drizzle-kit migrate                 # create all tables in your MySQL DB
npx tsx scripts/seed.ts                 # optional: starter fleet/blog/admin
```

`scripts/seed.ts` creates your admin login from `ADMIN_EMAIL` / `ADMIN_PASSWORD`
— change the password after first login (Admin → Site Settings → Admin
credentials), then consider removing those two lines from `.env`.

No SSH? Import the schema through **phpMyAdmin → Import** using the file
`drizzle/0000_mysql_init.sql` instead.

Then build:

```bash
npm run build
```

---

## 5. Register the Node application

cPanel → **Setup Node.js Application** → *Create Application*:

| Setting | Value |
|---|---|
| Node.js version | **20 or 22** |
| Application mode | `Production` |
| Application root | `/home/username/nodeapps/bikerent` |
| **Application startup file** | `server.js` |
| Application URL | your domain / subdomain (e.g. `ride.yoursite.com`) |

Passenger picks up `PORT` automatically; `server.js` reads it.

**Start** the app, then browse your URL. Logs: `/home/username/<app>/logs` or
cPanel's app page.

---

## 6. After it's live

1. Log in at `/admin` with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
2. Change the password: **Settings → Admin credentials**.
3. Under **Site settings**, replace contact details, WhatsApp, and socials.
4. Manage fleet, bookings, reviews, and blog from the panel.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| 503 / "Cannot find module" | `npm ci` wasn't run in the app root (or Node version < 20). |
| Works on `localhost` but not domain | Passenger needs the correct *Application URL* mapped; restart the app. |
| DB errors (`ECONNREFUSED`, `ER_ACCESS`) | Check `MYSQL_URL`/DB_* values; on shared hosts DB host is `localhost` and DBs are prefixed (`user_db`). |
| Images 502 | Make sure `public/` was uploaded and the app user owns it (`chmod -R 755 public`). |
| Static-only PHP host | Not supported. You need Node-capable cPanel hosting or a PaaS. |

---

## Images: uploads and serving

- **`sharp` is a hard dependency** (pinned), so the `next/image` optimizer works
  in production on shared hosts that skip packages listed "optional" upstream.
Everything lives in the **public folder**:

```
public/img/        default images shipped with the project
public/uploads/    images uploaded from the admin panel
public/fonts/      self-hosted web fonts
```

- Admin uploads are written to **`public/uploads/`** and get a
  `/uploads/<file>` URL, right beside the defaults in `public/img`.
- One caveat worth knowing: `next start` serves `public/` from a manifest
  captured at **build time**, so an image uploaded after the build would not
  be picked up by the static layer. The app therefore also serves that same
  folder through a small `/uploads/[file]` route, so **new uploads appear
  instantly with no rebuild**. Files already present at build time are served
  statically; `next/image` optimizes both.
- Make sure the app process can write to `public/uploads` (standard on
  Passenger/cPanel). The folder ships with a `.gitkeep`; the uploaded media
  itself is gitignored.
- If your host refuses image optimization even with `sharp` installed, set
  `NEXT_IMAGES_UNOPTIMIZED=true` — originals are then served directly.

---

## If your host has no Node.js at all

Two no-VPS alternatives that always work:

- **Vercel / Netlify / Railway / Render** (managed PaaS — free/cheap tier, connect
  GitHub, set the env vars from §3, deploy). Still not a VPS to manage; the host
  runs Node for you. Pair with a managed MySQL (PlanetScale, TurboDB, Aiven,
  TiDB Cloud) or any MySQL your host provides.
- Keep the frontend static anywhere and host the API separately — not
  recommended; the app is built as one server.

VPS (DigitalOcean/Hetzner/Linode) also works, of course — same `server.js` +
`npx drizzle-kit migrate` + a process manager (PM2) + Nginx.
