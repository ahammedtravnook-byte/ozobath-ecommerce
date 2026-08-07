# OZOBATH — Hostinger VPS Deployment

Working document for deploying the OZOBATH API to a Hostinger KVM 2 VPS.
Update the checkboxes as you go so any new session can resume from the right place.

---

## Architecture

| Component | Host | Domain |
|---|---|---|
| Client (React/Vite) | Vercel | `ozobath.com` |
| Admin (Vue/Vite) | Vercel | `admin.ozobath.com` |
| API (Express) | Hostinger VPS + Nginx + PM2 | `api.ozobath.com` |
| Database | MongoDB Atlas (managed) | — |

Monorepo: npm workspaces, `apps/{client,admin,server}`. Deps hoist to the root
`node_modules` — empty per-app `node_modules` is normal, not a broken install.

---

## Server facts

- **IPv4:** `200.141.9.251`
- **Hostname:** `srv1872317.hstgr.cloud`
- **Plan:** KVM 2 — 2 vCPU / 8 GB RAM / 100 GB NVMe / 8 TB bandwidth
- **OS:** Ubuntu 24.04 LTS (plain image, no Node template)
- **Region:** India — Mumbai 2
- **Expires:** 2028-08-01
- **App user:** `ozobath` (uid 1000, in `sudo` group)
- **Deploy path:** `/var/www/ozobath`
- **Node:** 22 LTS via nvm (**not** v24 — that is not LTS)

## Source

- **Repo:** `https://github.com/ahammedtravnook-byte/ozobath-ecommerce.git`
- **Branch:** `fix/production-readiness-blockers` (pushed) — merge to `main` before deploying
- **Commit:** `09c3d9f`

---

## ⚠️ Read before running anything

Three mistakes take the server down. Two are unrecoverable without a reinstall.

### 1. SSH lockout — the live risk

`PermitRootLogin no` + `PasswordAuthentication no` cuts off **every** login path
unless a working key is installed first.

**Rule: never disable password auth until you have logged in with a key in a
separate terminal, with the root session still open.**

Ubuntu 24.04 ships `/etc/ssh/sshd_config.d/50-cloud-init.conf` containing
`PasswordAuthentication yes`. `Include` runs first and the `50-` file sorts ahead
of `60-cloudimg-settings.conf`, so **it silently overrides `sshd_config`**. Edits
to the main file appear to work and do nothing. Comment out the drop-in too.

Ubuntu 24.04 also uses socket activation — `systemctl restart ssh` alone is not
enough. Run `daemon-reload`, then restart `ssh.socket`, then `ssh`.

### 2. `ufw` lockout

`ufw allow OpenSSH` **must** come before `ufw enable`. Reversed, the box is gone.

### 3. Never expose port 5000

Node binds `127.0.0.1:5000` and is reached only through Nginx.
`ufw allow 5000` would publish the unproxied API.

---

## Progress

### Phase 1 — Provision ✅
- [x] VPS created — Ubuntu 24.04 LTS, Mumbai 2, KVM 2
- [x] IPv4 noted: `200.141.9.251`
- [x] Malware scanner active
- [ ] **Auto-renewal ON** (currently OFF — expiry 2028-08-01)
- [ ] Backups: currently **weekly**; upgrade to daily (₹589/mo) — a week of lost
      orders is not acceptable for a store. Atlas backups matter more for order
      data; do both.
- [ ] DNS: `A  api  →  200.141.9.251`  TTL 300 (needed before Certbot)
- [ ] Skip Hostinger's "free domain" if `ozobath.com` is already owned — that
      offer is for a VPS hostname, not the storefront.

### Phase 2 — Harden ✅
- [x] `ozobath` user created, in `sudo` group
- [x] `/home/ozobath/.ssh/authorized_keys` installed with correct permissions
- [x] SSH key auth working (key mismatch fixed — old `ozobath-vps` key replaced)
- [x] Comment out `PasswordAuthentication yes` in
      `/etc/ssh/sshd_config.d/50-cloud-init.conf`
- [x] Apply `PermitRootLogin no` + `PasswordAuthentication no` in `sshd_config`
- [x] `sshd -t` → `daemon-reload` → restart `ssh.socket` → restart `ssh`
- [x] Verified: `ozobath` logs in with key, `root` is rejected
- [x] `ufw` — OpenSSH + 80/tcp + 443/tcp allowed, firewall enabled
- [x] `unattended-upgrades` + `fail2ban` installed and enabled

### Phase 3 — Runtime ✅
- [x] Node 22 LTS (v22.23.2) via nvm
- [x] `git clone` to `/var/www/ozobath`, branch `fix/production-readiness-blockers`
- [x] `npm ci --omit=dev`
- [x] Two fresh JWT secrets generated (48-byte hex each)
- [x] `apps/server/.env` written, `chmod 600`

### Phase 4 — Database 🔄 PARTIAL
- [ ] Atlas: remove `0.0.0.0/0`, whitelist only `200.141.9.251` ← **YOU**
- [ ] Dedicated user with `readWrite` on `ozobath` DB only (not admin) ← **YOU**
- [ ] Enable Atlas backups + point-in-time recovery ← **YOU**
- [x] `checkPaymentIntegrity.js` — all checks passed, unique index present

### Phase 5 — PM2 ✅
- [x] `pm2 start server.js --name ozobath-api -i max` (2 cluster workers)
- [x] `pm2 save` + `pm2 startup` — systemd service registered
- [x] `pm2-logrotate` installed

### Phase 6 — Nginx + TLS 🔄 PARTIAL
- [x] Reverse proxy config written and active (HTTP)
- [x] Default Nginx site removed
- [ ] DNS: `A api → 200.141.9.251` TTL 300 ← **YOU**
- [ ] `certbot --nginx -d api.ozobath.com` ← after DNS propagates, tell me
- [ ] `certbot renew --dry-run` ← after Certbot

### Phase 7 — Vercel
- [ ] Client project → Root Directory `apps/client`
- [ ] Admin project → Root Directory `apps/admin`
- [ ] Both: "Include files outside root directory" ON
- [ ] Both: `VITE_API_URL=https://api.ozobath.com/api/v1`
      (Production + Preview + Development)

### Phase 8 — Verify
- [ ] `curl https://api.ozobath.com/api/health` → 200
- [ ] `curl https://api.ozobath.com/api/v1/categories` → 200 + items
- [ ] PM2 logs show `✅ MongoDB Connected: <real-host>/ozobath`
- [ ] Browser: register → login → refresh → cart → **₹1 live payment** → order
      visible in admin → refund

---

## Required env vars

Boot fails fast if any of these are missing — by design.

```
MONGODB_URI  JWT_ACCESS_SECRET  JWT_REFRESH_SECRET
CLOUDINARY_CLOUD_NAME  CLOUDINARY_API_KEY  CLOUDINARY_API_SECRET
RAZORPAY_KEY_ID  RAZORPAY_KEY_SECRET
```

Production additionally rejects:
- secrets shorter than 32 chars
- placeholder text (`change_this`, `your_..._here`)
- `JWT_ACCESS_SECRET === JWT_REFRESH_SECRET`
- missing `CLIENT_URL` / `ADMIN_URL` (CORS depends on them)

### Gotchas

- Use **`JWT_ACCESS_EXPIRES_IN`**, not `JWT_ACCESS_EXPIRY`. The local `.env` has
  the wrong name, so its `15m` is ignored and the `1d` default applies. Do not
  copy that mistake.
- The local `.env` secret contains `change_me` — production **will refuse to boot**
  on it. Generate fresh ones.
- **Rotate every credential** before go-live: Cloudinary, Razorpay, Atlas. The
  current values have sat in a local file.
- Razorpay: switch to **live** keys (`rzp_live_*`).
- Tax flags default to current behaviour. Confirm GST treatment with the CA
  before changing — see `docs/TAX_CONFIGURATION.md`.

---

## Nginx config

`/etc/nginx/sites-available/ozobath-api`

```nginx
server {
    listen 80;
    server_name api.ozobath.com;

    client_max_body_size 12M;      # multer allows 10MB; Nginx default 1M → 413

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;   # bulk XLSX upload exceeds the 60s default
    }
}
```

Each commented line fixes a real bug in this app, not boilerplate:
`X-Forwarded-For` is what makes `app.set('trust proxy', 1)` work — without it,
rate limiting counts every request as one client and is effectively decorative.

TLS is **mandatory**: refresh cookies are `secure; sameSite=none`, so auth cannot
work over plain HTTP.

### Frontend server block

`/etc/nginx/sites-available/ozobath-client` — copy from
[`deploy/nginx-ozobath-client.conf`](../deploy/nginx-ozobath-client.conf).

```bash
sudo cp deploy/nginx-ozobath-client.conf /etc/nginx/sites-available/ozobath-client
sudo ln -sf /etc/nginx/sites-available/ozobath-client /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Adjust `root` to wherever `apps/client/dist` is published before reloading.

**Why it matters.** Measured against the live site on nginx/1.24.0, stock config
gzipped only `text/html`, so the CSS and JS bundles went out uncompressed —
140,831 bytes of CSS and 495,148 bytes of JS on every cold load. Widening
`gzip_types` takes the stylesheet from 138 KB to 20 KB (−85%). The same block
also enables HTTP/2 and TLS 1.3, and serves `/llms.txt` as Markdown instead of
letting the SPA catch-all return `index.html`.

Verify after reloading:

```bash
curl -sI -H 'Accept-Encoding: gzip' https://ozobath.in/assets/<hashed>.css \
  | grep -i content-encoding          # expect: content-encoding: gzip
curl -sI https://ozobath.in/llms.txt | grep -i content-type   # expect: text/markdown
curl -s -o /dev/null -w '%{http_version}\n' https://ozobath.in/   # expect: 2
```

---

## Deploy script

Always `reload` (zero-downtime), never `restart`:

```bash
cd /var/www/ozobath && git pull && npm ci --omit=dev && pm2 reload ozobath-api
```

---

## Production fixes already in this branch

Committed in `09c3d9f` — context for why the code looks the way it does.

1. **`app.set('trust proxy', 1)`** — production only. Behind Nginx every request
   appears to come from `127.0.0.1`, so rate limiting was counting all traffic as
   one client. Must stay `1`; `true` would trust client-supplied
   `X-Forwarded-For` and let anyone spoof an IP past the login limiter.
2. **Crash handlers** — `unhandledRejection` drains in-flight requests then exits
   1; `uncaughtException` exits immediately. Node kills the process on unhandled
   rejections by default, so one missed `.catch()` took the API down.
3. **5xx logging always on** — the log line was gated on
   `NODE_ENV === 'development'`, the exact inverse of what production needs.
   500s now log method, URL, IP, and stack. **A flood of these means the
   database is unreachable, not that the logger is misbehaving.**
4. **Env validation** — fail fast at boot instead of at request time.
5. **`socket.io` removed** — zero imports; dead dependency.
6. **`db.js` race fixed** — the `disconnected` handler spawned a second retry
   loop sharing (and resetting) `retryCount`, so `MAX_RETRIES` never capped and
   a dead DB logged `✅ MongoDB Connected: undefined`. On the VPS that would have
   meant PM2 logs showing success while the API was down.
7. **Razorpay reconciliation** — `PendingCheckout` model, idempotency on
   `razorpayOrderId`, unified totals, `checkPaymentIntegrity.js`.

---

## Known non-blocking issues

- Mongoose warns about duplicate `slug` / `order` indexes (both `index: true` and
  `schema.index()`). Harmless, pre-existing.
- `multer@1.4.5-lts.2` is deprecated with known CVEs — upgrade to 2.x (breaking
  API changes; retest uploads).
- Repo root holds loose scripts. **`clean_db.js` runs `deleteMany({})` on Orders
  and loads the prod `.env` by relative path — delete it before it can run near
  production credentials.** Same for `remove_bg.js`, `update_images*.js`.
- `packages/shared` is imported by neither app — dead workspace.
- PM2 cluster mode multiplies in-memory rate-limit counters per worker (real
  limit = 500 × workers). Move to a Redis store if that matters.

---

## Post-launch

- External uptime monitor on `/api/health` (UptimeRobot) — a server that monitors
  itself tells you nothing when it is down.
- Sentry for error tracking.
- **Test a restore, not just a backup.** Untested backups are not backups.
- Run `checkPaymentIntegrity.js` periodically.
