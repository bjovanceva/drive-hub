# Deploy Drive Hub behind shared Nginx

This repository runs Nuxt 4.5.2 (Nitro node-server, SSR/API and chat WebSockets),
Vue 3, Node 24 in Docker, Prisma 7, and PostgreSQL 17. npm uses
`package-lock.json` and `npm ci`. There are no separate queue workers, caches, or
file uploads to deploy. PostgreSQL is the persistent application store; sessions
are sealed cookies whose key must remain stable.

## Network contract

`docker-compose.prod.yml` declares project **drive-hub**. Only `app` joins the
existing external bridge **web-proxy**, with alias **nuxt-web**, listening on
**0.0.0.0:3000**. Nginx must route this app's public hostname to
`http://nuxt-web:3000`, preserve `Host`, forward `X-Forwarded-Proto` and
`X-Forwarded-For`, and support upgrades on `/ws/chat`. PostgreSQL and the migration
tool join only the project network, which is internal. No service publishes any
host port. Host port 3050/3052 settings from the previous deployment do not apply
under this architecture. Certificates and public ports belong to shared Nginx.

The shared Nginx must re-resolve Docker DNS after app container replacement,
or its operator must reload Nginx after each release. A static upstream IP cached
at Nginx startup can otherwise cause 502 responses after an update. Configure
that in the shared proxy; this repository does not modify its configuration.

The shared-proxy operator creates `web-proxy` and configures the domain/proxy;
this repository and `setup-vm.sh` do not change that infrastructure. Verify it
exists before starting:

```bash
sudo docker network inspect web-proxy
```

Use the real application domain wherever `drivehub.example.com` appears below.
Only one running app may own alias `nuxt-web` on this network. The explicit project
name must stay stable across releases to reuse `drive-hub_postgres_data`. The old
VM directory `/opt/drive-hub` used the same project name, so its existing named
volume is reused. If your old deployment used another project name, identify and
back up its database volume before switching. Do not run development and
production with the same project name on one Docker daemon.

## Build and publish a release

First confirm the VM CPU architecture:

```bash
uname -m
```

Use `linux/amd64` for `x86_64`, or `linux/arm64` for `aarch64`. On your build
machine, substitute your registry namespace and a new release tag:

```bash
docker login
docker buildx build --platform linux/amd64 --target runtime \
  -t your-dockerhub-user/drive-hub-app:1.0.1 --push .
docker buildx build --platform linux/amd64 --target tooling \
  -t your-dockerhub-user/drive-hub-tooling:1.0.1 --push .
```

For a local image smoke test, replace `--push` with `--load`. For multiple CPU
architectures use `--platform linux/amd64,linux/arm64 --push`. Publish both targets
from the same source revision. The VM needs only `docker-compose.prod.yml`, its
private environment file, and optionally `setup-vm.sh`; source/build tools are
not needed there. The runtime includes `.output` with generated Prisma and server
dependencies. The tooling image contains the locked Prisma CLI, migrations, and
administrator scripts. Runtime Node processes run as `node`; `init: true` and a
30-second stop grace period allow termination. Logs rotate at 10 MB, three files
per container. PostgreSQL has a 60-second stop grace period.

## Private runtime settings and proxy trust

Store deployment files in `/opt/drive-hub`, owned by the deployment user, and
keep `.env.production` out of Git:

```bash
cd /opt/drive-hub
cp .env.production.example .env.production
chmod 600 .env.production
openssl rand -hex 32
openssl rand -hex 32
```

Put the two different generated values into `POSTGRES_PASSWORD` and
`NUXT_SESSION_PASSWORD`. Use the published `APP_IMAGE` and `TOOLING_IMAGE` tags.
For the current HTTP starter set:

```dotenv
APP_ORIGIN=http://drivehub.example.com
NUXT_SESSION_COOKIE_SECURE=false
```

`APP_ORIGIN` is the exact public origin, including a port only if the shared
proxy uses a custom public port. It controls allowed HTTP Host and WebSocket
Origin values. HTTPS-ready configuration is:

```dotenv
APP_ORIGIN=https://drivehub.example.com
NUXT_SESSION_COOKIE_SECURE=true
```

Use HTTP only for the starter smoke tests; switch both values when the shared
proxy's TLS is ready. Secure cookies cannot be saved over ordinary public HTTP,
which explains the previous successful login followed by a guest redirect.
Session cookies remain HttpOnly and SameSite=Lax in either mode.

Set `TRUSTED_PROXY_CIDRS` deliberately. Obtain Nginx's address on `web-proxy` from
its operator (replace the container name below):

```bash
PROXY_CONTAINER=shared-nginx
sudo docker inspect "$PROXY_CONTAINER" \
  --format '{{(index .NetworkSettings.Networks "web-proxy").IPAddress}}'
sudo docker network inspect web-proxy \
  --format '{{range .IPAM.Config}}{{println .Subnet}}{{end}}'
```

Prefer a stable Nginx IPv4 address with `/32` (IPv6 `/128`), for example
`TRUSTED_PROXY_CIDRS=172.30.0.2/32`. A comma-separated list supports several
proxies. If its address changes on recreation, update the setting and recreate
`app`, or have the operator assign a stable address. Trust the whole network
subnet only if every container on that subnet is trusted to set forwarded
headers; sharing it with other applications makes that a broader trust decision.
Never use `0.0.0.0/0` or `::/0`.

The server accepts forwarded protocol and client IP only from trusted socket
peers. It walks the IP chain from the trusted side and removes spoofed entries.
`Forwarded` and `X-Forwarded-Host` are discarded; the preserved `Host` is used.
WebSocket origin checking uses the configured public origin directly. If Nginx
is behind another proxy, its operator must safely preserve the original scheme,
rather than blindly accepting client-supplied headers. Local container health
checks at `127.0.0.1:3000/api/health` are allowed without the public Host.

Compose injects `APP_ORIGIN` as `NUXT_APP_ORIGIN` and `TRUSTED_PROXY_CIDRS` as
`NUXT_TRUSTED_PROXY_CIDRS`. `NUXT_SESSION_PASSWORD` and
`NUXT_SESSION_COOKIE_SECURE` override private Nuxt runtimeConfig; none is exposed
in `runtimeConfig.public`. The entrypoint URL-encodes PostgreSQL credentials and
constructs `DATABASE_URL=postgresql://...@postgres:5432/...` at runtime. The built
Nitro server does not load a project `.env`; Compose injects these variables.
No production secrets are needed during image builds. Changing the PostgreSQL
password in the file does not change a password in an existing database.

## Initial setup and explicit migrations

The helper installs missing Docker/Compose/Python on Ubuntu, safely parses the
private environment, generates absent secrets once, and checks that `web-proxy`
already exists. It prompts for missing image names, domain and trusted proxies.
It publishes no ports and installs no certificate proxy.

```bash
bash setup-vm.sh \
  --app-image your-dockerhub-user/drive-hub-app:1.0.1 \
  --tooling-image your-dockerhub-user/drive-hub-tooling:1.0.1 \
  --domain drivehub.example.com --trusted-proxies 172.30.0.2/32 \
  --http --migrate
```

`--migrate` explicitly runs Prisma migrations before app startup. On an existing
production database, take and verify a backup first. Reruns without this flag
start only the current application and database; they do not run migrations.
Add `--login` for a private registry. Add `--admin-email admin@example.com` to
create an administrator with a hidden password prompt.

For manual setup, use the following commands in the deployment directory:

```bash
sudo docker compose --env-file .env.production -f docker-compose.prod.yml config --quiet
sudo docker compose --env-file .env.production -f docker-compose.prod.yml pull app postgres migrate
sudo docker compose --env-file .env.production -f docker-compose.prod.yml up -d --wait postgres
sudo docker compose --env-file .env.production -f docker-compose.prod.yml run --rm migrate
sudo docker compose --env-file .env.production -f docker-compose.prod.yml up -d --wait app
sudo docker compose --env-file .env.production -f docker-compose.prod.yml ps -a
sudo docker compose --env-file .env.production -f docker-compose.prod.yml \
  run --rm --no-deps migrate node scripts/admin.mjs create \
  --email admin@example.com --name Administrator
```

The `tools` profile keeps migrations out of a normal `up`; naming `migrate` in
`run` activates it explicitly. No demo seeding occurs. Supply required category
and curriculum data separately; do not run a development seed on live data.

## Verify before opening the application

Confirm no published ports with `compose ps`. Run the in-container health check:

```bash
sudo docker compose --env-file .env.production -f docker-compose.prod.yml exec -T app \
  node -e "fetch('http://127.0.0.1:3000/api/health').then(async r => { console.log(r.status, await r.text()); process.exit(r.ok ? 0 : 1) })"
curl -i http://drivehub.example.com/api/health
curl -I http://drivehub.example.com/schools
```

If DNS is not ready, test the shared proxy using
`curl --resolve drivehub.example.com:80:VM_PUBLIC_IP http://drivehub.example.com/api/health`.
Inspect `/schools`, `/login` and `/register` in a browser, check that `_nuxt` assets
load and hydration completes, and submit invalid fields to see specific errors.
Register a test account and verify login/logout. Check `/api/_auth/session` after
login. Open chat and verify `/ws/chat` upgrades and receives its `ready` event.
After enabling TLS, repeat with HTTPS and confirm the session cookie has Secure.
Never use the VM IP as the app URL: the public domain is enforced.

Verify persistence by recreating `app` and `postgres` without deleting volumes,
then logging in with the same test account:

```bash
sudo docker compose --env-file .env.production -f docker-compose.prod.yml \
  up -d --force-recreate --wait postgres app
```

A configured proxy route and actual DNS/TLS remain the shared-proxy operator's
responsibility. Network-local health alone does not verify that public route.

## Backup, update, and rollback

Back up PostgreSQL **before every migration**, and preserve the private runtime
file securely. Keep backups off the VM as well, and test restores in a separate
disposable database. An example backup:

```bash
umask 077
mkdir -p backups
BACKUP_FILE="backups/drive-hub-$(date -u +%Y%m%dT%H%M%SZ).dump"
sudo docker compose --env-file .env.production -f docker-compose.prod.yml exec -T postgres \
  sh -c 'exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$BACKUP_FILE"
test -s "$BACKUP_FILE"
sudo docker compose --env-file .env.production -f docker-compose.prod.yml exec -T postgres \
  pg_restore --list < "$BACKUP_FILE" > /dev/null
cp .env.production .env.production.previous
chmod 600 .env.production.previous
```

For an update, publish new immutable app/tooling tags from the same revision,
record the old tags, and edit both image references in `.env.production`. Then:

```bash
sudo docker compose --env-file .env.production -f docker-compose.prod.yml pull app migrate
# Stop writes before schema changes that cannot run with the previous release.
sudo docker compose --env-file .env.production -f docker-compose.prod.yml stop app
sudo docker compose --env-file .env.production -f docker-compose.prod.yml run --rm migrate
sudo docker compose --env-file .env.production -f docker-compose.prod.yml up -d --wait app
```

If a migration fails, leave `app` stopped, inspect its tooling logs, and resolve
the schema problem before proceeding. Do not change secret values or project
name during routine updates. When Nginx HTTPS is ready, run
`bash setup-vm.sh --https` and repeat the public authentication checks.

To roll back **only if the database remains compatible**, restore the previous
image references (or preserved runtime file), then pull/recreate the app:

```bash
cp .env.production.previous .env.production
chmod 600 .env.production
sudo docker compose --env-file .env.production -f docker-compose.prod.yml pull app
sudo docker compose --env-file .env.production -f docker-compose.prod.yml up -d --wait app
```

An image rollback does not roll back Prisma migrations. If the old schema is
required, stop app writes and restore the verified backup. This discards changes
made after that backup; plan the recovery with the data owner. The following
commands deliberately replace the database; use them only for that recovery:

```bash
sudo docker compose --env-file .env.production -f docker-compose.prod.yml stop app
sudo docker compose --env-file .env.production -f docker-compose.prod.yml exec -T postgres \
  sh -c 'dropdb --if-exists --force -U "$POSTGRES_USER" "$POSTGRES_DB" && createdb -U "$POSTGRES_USER" "$POSTGRES_DB"'
sudo docker compose --env-file .env.production -f docker-compose.prod.yml exec -T postgres \
  sh -c 'exec pg_restore --exit-on-error --no-owner --no-acl -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < "$BACKUP_FILE"
sudo docker compose --env-file .env.production -f docker-compose.prod.yml up -d --wait app
```

Never use `docker compose down -v` for an update: it deletes the named database
volume. Database-major-version upgrades need a separate PostgreSQL migration
plan; keep PostgreSQL 17 for these application releases.

## Preparation validation

Local validation built both Docker targets, resolved production Compose, and
passed Nuxt type checking plus 36 setup/authentication/proxy/chat/account tests.
An isolated Nginx stack exercised SSR pages, compiled assets, health, HTTP and
HTTPS login/registration, correct cookie flags, WebSocket origin/session checks,
and persistence after app/PostgreSQL recreation. Browser testing confirmed
hydration, readable form errors, and a login session surviving page reload.
The documented database dump and archive-readability commands were also checked.
HTTPS tests used a disposable trusted test certificate, not a certificate issued
for your public domain. No real VM or shared proxy was changed.

Before deploying, confirm the VM architecture, publish both updated images,
configure the real public origin and trusted Nginx addresses, verify the shared
network/upstream route, back up existing data, run migrations explicitly, and
repeat public HTTP/HTTPS checks once the operator configures DNS and TLS.
