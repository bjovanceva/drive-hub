# Drive Hub

<p align="center">
  <img src="app/assets/Drive-Hub-Logo.svg" alt="Drive Hub logo" width="220">
</p>

Drive Hub is a full-stack driving-school platform for discovering schools,
submitting licence applications, managing training, scheduling lessons, and
communicating in real time. It provides dedicated workspaces for applicants,
students, instructors, school managers, and platform administrators.

## Table of contents

- [About the project](#about-the-project)
- [Key features](#key-features)
- [User roles](#user-roles)
- [Technology stack](#technology-stack)
- [Getting started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment variables](#environment-variables)
  - [Database setup](#database-setup)
  - [Start the development server](#start-the-development-server)
- [Development data](#development-data)
- [Available scripts](#available-scripts)
- [Application routes](#application-routes)
- [Architecture](#architecture)
  - [Authentication and authorization](#authentication-and-authorization)
  - [Training and curriculum](#training-and-curriculum)
  - [Administration](#administration)
  - [Role-based dashboard](#role-based-dashboard)
  - [Real-time messaging](#real-time-messaging)
- [Testing](#testing)
- [Production](#production)
- [Project structure](#project-structure)
- [Further documentation](#further-documentation)
- [Authors](#authors)

## About the project

Drive Hub brings the main parts of the driving-school journey into one
application. Visitors can compare schools and licence categories, applicants can
submit and follow applications, and enrolled students can track curriculum
progress. Instructors and managers work from role-specific dashboards, while
platform administrators manage the complete directory and its relationships.

The application uses server-rendered Nuxt pages, PostgreSQL persistence through
Prisma, cookie-based sessions, and an authenticated WebSocket channel for chat.

## Key features

- Searchable driving-school directory with city and licence-category filters.
- User registration, login, profile editing, and password changes.
- Applications with preferred instructors and a complete status lifecycle.
- Role-aware dashboards for applicants, students, instructors, and managers.
- Curriculum-backed training progress for all 17 supported licence categories.
- Lesson scheduling, completion, cancellation, and conflict validation.
- School, instructor, student, vehicle, and application management.
- Real-time private and group messaging with reconnect and deduplication.
- A protected administration workspace with transactional CRUD operations.
- Idempotent development seeding and isolated integration test databases.

## User roles

| Role           | Main capabilities                                                                        |
| -------------- | ---------------------------------------------------------------------------------------- |
| Visitor        | Browse schools and categories, register, or sign in.                                     |
| Applicant      | Select a school and category, submit an application, and follow its status.              |
| Student        | View active and historical training, lesson progress, bookings, instructor, and vehicle. |
| Instructor     | Review assigned students, sessions, progress, and vehicles.                              |
| School manager | Process applications, manage the school roster and fleet, and schedule lessons.          |
| Administrator  | Manage users, schools, vehicles, memberships, and applications across the platform.      |

`USER` and `ADMIN` are the platform-level roles. Student, instructor, and
manager access is represented by school relationships, keeping school-specific
permissions separate from global administration.

## Technology stack

| Area                 | Technology                           |
| -------------------- | ------------------------------------ |
| Application          | Nuxt 4, Vue 3, TypeScript            |
| Server API           | Nitro server routes                  |
| Database             | PostgreSQL 17                        |
| ORM                  | Prisma 7 with the PostgreSQL adapter |
| Authentication       | `nuxt-auth-utils` cookie sessions    |
| Validation           | Zod                                  |
| Password hashing     | AdonisJS Hash                        |
| Real-time transport  | Native WebSockets through Nitro      |
| Testing              | Node.js test runner                  |
| Local infrastructure | Docker Compose                       |

## Getting started

### Prerequisites

Install the following before starting:

- [Node.js](https://nodejs.org/) 22.19 or newer (the Docker images use Node 24);
- npm (included with Node.js); and
- [Docker](https://www.docker.com/) with Docker Compose, or a compatible local
  PostgreSQL instance.

### Installation

Clone the repository and install its dependencies:

```bash
git clone https://github.com/bjovanceva/drive-hub.git
cd drive-hub
npm install
```

### Environment variables

Create a local environment file from the supplied template:

```bash
cp .env.example .env
```

Configure these values in `.env`:

| Variable                   | Required | Description                                                            |
| -------------------------- | -------- | ---------------------------------------------------------------------- |
| `POSTGRES_USER`            | Yes      | PostgreSQL user used by the app and Docker service.                    |
| `POSTGRES_PASSWORD`        | Yes      | Password for the PostgreSQL user.                                      |
| `POSTGRES_DB`              | Yes      | PostgreSQL database name.                                              |
| `DATABASE_URL`             | Local    | Host-side Prisma connection URL; replace the template placeholders and URL-encode credentials. Compose constructs its own URL. |
| `NUXT_SESSION_PASSWORD`    | Yes      | Random session secret containing at least 32 characters.               |
| `SEED_DEFAULT_PASSWORD`    | No       | Password assigned to development accounts; defaults to `DriveHub123!`. |
| `ALLOW_PRODUCTION_SEED`    | No       | Set to `true` only when deliberately allowing a seed in production.    |
| `DRIVE_HUB_ADMIN_PASSWORD` | No       | Password supplied to non-interactive admin CLI commands.               |
| `APP_PORT`                | No       | Published application port for Compose; defaults to `3000`.            |
| `APP_BIND_ADDRESS`        | No       | Interface for the published app port; defaults to `0.0.0.0`.           |
| `POSTGRES_PORT`           | No       | Local database port in the development override; defaults to `5432`.   |

Keep `.env` out of source control. Generate a strong session secret before
running the application outside local development.

### Database setup

Start PostgreSQL, apply the committed migrations, generate the Prisma client,
and load the development dataset:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres
npx prisma migrate deploy
npm run db:generate
npm run db:seed
```

The development override exposes PostgreSQL on `127.0.0.1:5432` and persists its
data in the `postgres_data` volume. The main Compose file keeps PostgreSQL
accessible only to the containers. If you change `POSTGRES_PORT`, update the
port in your host-side `DATABASE_URL` too.

After changing `prisma/schema.prisma`, create or apply the appropriate migration
and run `npm run db:generate` again.

### Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). WebSocket support is
enabled in `nuxt.config.ts`; restart the development server after changing its
configuration.

## Development data

`npm run db:seed` is transactional and idempotent. It creates or refreshes:

- 17 licence categories;
- 442 ordered curriculum lessons;
- five driving schools and their category relationships;
- five users representing the main application contexts;
- six vehicles; and
- example applications in each supported status.

All seeded accounts use `SEED_DEFAULT_PASSWORD`, or `DriveHub123!` when it is
not set.

| Context              | Email                      |
| -------------------- | -------------------------- |
| Applicant            | `applicant@drivehub.test`  |
| Student              | `student@drivehub.test`    |
| Instructor           | `instructor@drivehub.test` |
| School manager       | `manager@drivehub.test`    |
| Global administrator | `admin@drivehub.test`      |

Every account signs in through `/login`; administrators are then directed to
`/administration`. Seeding is blocked when `NODE_ENV=production` unless
`ALLOW_PRODUCTION_SEED=true` is explicitly set.

To refresh only the licence categories, run:

```bash
npm run db:seed:categories
```

This command applies `prisma/seed-categories.sql`, updating existing rows by
their unique code and inserting missing rows.

## Available scripts

| Command                             | Purpose                                             |
| ----------------------------------- | --------------------------------------------------- |
| `npm run dev`                       | Start the Nuxt development server.                  |
| `npm run build`                     | Create a production build.                          |
| `npm run preview`                   | Preview the production build locally.               |
| `npm run generate`                  | Generate a static Nuxt output where supported.      |
| `npm run typecheck`                 | Run Nuxt and Vue TypeScript checks.                 |
| `npm run db:generate`               | Regenerate the Prisma client.                       |
| `npm run db:seed`                   | Seed the complete development dataset.              |
| `npm run db:seed:categories`        | Seed only licence categories.                       |
| `npm run admin:create -- [options]` | Create a platform administrator.                    |
| `npm run admin:update -- [options]` | Update an existing administrator.                   |
| `npm run test:accounts`             | Run authentication and account tests.               |
| `npm run test:chat`                 | Run real-time chat tests.                           |
| `npm run test:curriculum`           | Validate curriculum coverage and ordering.          |
| `npm run test:manager`              | Run manager integration tests.                      |
| `npm run test:admin`                | Run administration integration tests.               |
| `npm run test:admin:http`           | Exercise admin routes through a built Nitro server. |

### Administrator commands

Administrators are deliberately managed outside the web administration forms:

```bash
npm run admin:create -- --email admin@example.com --name "Administrator"
npm run admin:update -- --email admin@example.com
npm run admin:update -- --email admin@example.com \
  --new-email new-admin@example.com --name "New Administrator"
```

The commands prompt for a password and confirmation using hidden input. For
non-interactive use, pass the password in `DRIVE_HUB_ADMIN_PASSWORD`. Run
`npm run admin:create -- --help` for the full command reference.

Creating an administrator never converts or overwrites an ordinary user.
Updating one preserves its ID, requires an existing `ADMIN` record, and changes
only the supplied identity fields and password. Existing sessions are not
revoked automatically.

## Application routes

| Route                | Access        | Purpose                                         |
| -------------------- | ------------- | ----------------------------------------------- |
| `/`                  | Public        | Landing page and school search.                 |
| `/schools`           | Public        | Search and browse driving schools.              |
| `/schools/:id`       | Public        | View one school and its offering.               |
| `/categories`        | Public        | Browse licence categories.                      |
| `/login`             | Guest         | Sign in to an existing account.                 |
| `/register`          | Guest         | Create an ordinary user account.                |
| `/start-application` | User          | Start a driving-school application.             |
| `/dashboard`         | User          | Open the workspace for the current school role. |
| `/profile`           | User          | Edit profile details or change password.        |
| `/messages`          | User          | Browse conversations.                           |
| `/messages/:id`      | User          | Open a conversation.                            |
| `/administration`    | Administrator | Manage platform data and relationships.         |

API handlers are located under `server/api/`. Protected server handlers derive
the identity from the current session instead of trusting client-supplied user
or school IDs.

## Architecture

The client is organized around Nuxt pages, reusable Vue components, and
composables for auth, school search, administration, dashboards, and chat. Nitro
route handlers validate requests and delegate business rules to services, while
repositories and Prisma own persistence.

```text
Browser
  -> Nuxt pages, components, middleware, and composables
  -> Nitro HTTP API / authenticated WebSocket route
  -> Services and authorization rules
  -> Repositories and Prisma
  -> PostgreSQL
```

### Authentication and authorization

Authentication uses signed `nuxt-auth-utils` cookie sessions. The public auth
endpoints are:

- `POST /api/auth/register` creates a `USER` account and starts a session;
- `POST /api/auth/login` signs in either a `USER` or an `ADMIN`; and
- `POST /api/auth/logout` clears the current session.

Client middleware controls navigation:

- `auth.ts` protects ordinary-user pages;
- `admin.ts` protects the administration page; and
- `guest.ts` redirects signed-in visitors away from login and registration.

Server endpoints separately enforce current database permissions through
`requireOrdinaryUser`, `requireSchoolManager`, and `requireAdmin`. Authorization
is therefore not dependent on route middleware or a role sent by the browser.
Shared route constants live in `shared/constants/routes.ts`.

Ordinary users can update their own name and email or change their password from
`/profile`. Email and password changes require the current password. The server
derives the account ID from the session and does not accept role or school
relationship changes through account settings.

### Training and curriculum

The training domain separates a reusable curriculum from each student's
progress:

- `CurriculumLesson` defines an ordered theory or practical lesson for a licence
  category.
- `TrainingEnrollment` connects a student, school, category, instructor, and
  optional vehicle after application approval.
- `LessonSession` records scheduled and actual times, status, notes, instructor,
  and vehicle for one lesson attempt.

Progress is derived from distinct completed lesson sessions. The next lesson is
the lowest-sequence curriculum item without a completed session, which avoids
stale counters. Multiple attempts are retained as history.

The bundled curriculum is realistic development data informed by North
Macedonian exam structure and common European category competencies; it does not
claim regulatory accreditation. Update `prisma/curriculum.mjs` when adapting it
to an approved local teaching plan.

### Administration

The `/administration` workspace contains three main areas:

- **Users** — search accounts, manage ordinary-user details and passwords, and
  assign exactly one student, instructor, or manager relationship.
- **Schools** — manage schools, managers, rosters, categories, vehicles, and
  vehicle-to-instructor assignments.
- **Applicants** — manage application status and approve applications into
  training enrollments.

Administrative mutations use serializable transactions. Relationship changes
clean up incompatible instructor and vehicle assignments. Managers cannot
manage multiple schools, active or paused enrollments reserve instructor
capacity, and each instructor is limited to three current students. Categories
referenced by applications cannot be removed until those applications change.

Deleting an application preserves its training history. Deleting a user removes
their applications and clears their manager and instructor references. Deleting
a school removes its vehicles and applications and unassigns its members while
preserving their accounts.

### Role-based dashboard

`/dashboard` is the shared entry point for authenticated ordinary users:

- Students see current and past training, overall/theory/practical progress,
  their instructor and vehicle, the next curriculum lesson, and upcoming
  bookings.
- Instructors see their assigned sessions, student roster, student progress, and
  vehicles. Unassigned theory sessions are excluded from an instructor's
  schedule.
- Managers review applicants, instructors, students, vehicles, scheduled
  lessons, and the searchable lesson ledger. They can schedule, reschedule,
  complete, or cancel sessions within conflict and timing rules.
- Applicants see the context needed to continue their school application
  journey.

The dashboard response is scoped entirely from the authenticated database
identity. Manager mutations also verify current school membership on the
server.

### Real-time messaging

Messages are persisted through the authenticated HTTP API and delivered through
`/ws/chat` only to current conversation participants. The WebSocket handshake
uses the existing session cookie, validates request origin and database role,
and rechecks membership before delivery.

The client reconnects with backoff, reloads the latest 50 messages, deduplicates
message IDs, and refreshes conversation previews. Older-history pagination is
not yet implemented.

The live connection registry is in memory and supports one Nitro process. A
multi-process or multi-replica deployment needs a shared pub/sub layer such as
Redis. The reverse proxy must forward WebSocket upgrades and preserve the public
request origin; static hosting cannot support the messaging server.

## Testing

Run the fast checks before opening a pull request:

```bash
npm run typecheck
npm run test:accounts
npm run test:chat
npm run test:curriculum
```

Database-backed manager and administration suites use randomly named disposable
PostgreSQL schemas and remove them after completion:

```bash
npm run test:manager
npm run test:admin
```

The configured database user must be allowed to create schemas. These suites do
not modify the public schema.

The HTTP regression suite requires a current production build and exercises the
real Nitro server with authenticated requests:

```bash
npm run build
npm run test:admin:http
```

It covers resource CRUD, membership assignment, application approval, exclusive
school roles, and access denial for guests and ordinary users.

## Production

Create and preview a production build with:

```bash
npm run build
npm run preview
```

### Run the complete application with Docker Compose

Docker Compose runs PostgreSQL 17, a one-off Prisma migration service, and the
production Nuxt/Nitro server. Nuxt serves the frontend, API, and chat WebSocket
from the same container. PostgreSQL must pass its health check before migrations
run, and migrations must succeed before the app starts.

On a fresh checkout, copy `.env.example` to `.env`. Set `POSTGRES_USER`,
`POSTGRES_PASSWORD`, `POSTGRES_DB`, and a random `NUXT_SESSION_PASSWORD` containing
at least 32 characters. For example, generate each secret with:

```bash
openssl rand -hex 32
```

The containers construct their database URL from the PostgreSQL values and use
the internal hostname `postgres`; a host-side `DATABASE_URL` is ignored. Secrets,
local dependencies, and generated files are excluded from the image build.

Build and start the full stack:

```bash
docker compose up -d --build
docker compose ps -a
docker compose logs -f app migrate
```

Open [http://localhost:3000](http://localhost:3000), or the configured `APP_PORT`.
An exited `migrate` container with exit code `0` is expected. The app health check
uses `/api/health` to verify both the server and its database connection.

A fresh database has the schema but no application data. Import your production
data, including the category and curriculum catalogue, before opening the service
to users. The demo seed is never run automatically. Create the first administrator
with the existing CLI, which prompts for a password:

```bash
docker compose run --rm --no-deps migrate node scripts/admin.mjs create \
  --email admin@example.com --name "Administrator"
```

For hosting, put the app behind your provider's HTTPS reverse proxy. Forward
`Host`, `X-Forwarded-Proto`, and the WebSocket upgrade headers for `/ws/chat`.
If the proxy runs directly on the same server, set `APP_BIND_ADDRESS=127.0.0.1`
to make the application port reachable only locally. PostgreSQL has no published
port in the main Compose file.

After updating the source, rebuild and start with `docker compose up -d --build`.
Compose applies pending migrations before starting the new app. Back up the
database before deploying schema changes. PostgreSQL data survives rebuilds and
`docker compose down` in the existing `postgres_data` volume; `down -v` deletes it.
Changing PostgreSQL credentials in `.env` does not change credentials already
stored in an initialized database.

### Deploy published images on a VM

`docker-compose.prod.yml` is a standalone public deployment file. It uses
published images and requires no source checkout, Dockerfile, or local build on
the VM. Share this file and `.env.production.example`; keep the real
`.env.production` private.

First publish the `runtime` and `tooling` targets from the same source revision.
Replace `your-dockerhub-user` with your Docker Hub namespace. This example builds
for an Intel/AMD Linux VM; use `linux/arm64` for an ARM VM, or
`linux/amd64,linux/arm64` to publish both architectures:

```bash
docker login
docker buildx build --platform linux/amd64 --target runtime \
  -t your-dockerhub-user/drive-hub-app:1.0.0 --push .
docker buildx build --platform linux/amd64 --target tooling \
  -t your-dockerhub-user/drive-hub-tooling:1.0.0 --push .
```

For automatic Ubuntu VM setup, copy `setup-vm.sh` and `docker-compose.prod.yml`
into a dedicated directory on the VM. Run:

```bash
bash setup-vm.sh \
  --app-image your-dockerhub-user/drive-hub-app:1.0.0 \
  --tooling-image your-dockerhub-user/drive-hub-tooling:1.0.0
```

The script installs Docker Engine, the Compose plugin, and Python 3 if missing,
using Docker's official Ubuntu package repository. It requests sudo privileges
when needed, starts Docker, generates missing database and session secrets, saves
`.env.production` with permissions `600`, pulls the images, and waits for the
application to become healthy after migrations. It preserves existing secrets
and data on reruns. It also runs on other Linux distributions when Docker,
Compose, and Python 3 are already installed.

Omit the image arguments to be prompted interactively, or to reuse image
references already saved in `.env.production`. Add `--login` for private image
repositories, `--port 8080` to change the published port, or
`--bind-address 127.0.0.1` for a proxy on the VM. Add
`--admin-email admin@example.com` to create an administrator after startup; its
password is prompted for with hidden input. Use `bash setup-vm.sh --help` for
all options. The script starts the app with an empty schema on a new database;
import your application data and configure HTTPS/networking as described above.

For manual setup, install Docker Engine and Docker Compose. Copy the production Compose
file and environment template into a dedicated directory, then create the private
configuration:

```bash
cp .env.production.example .env.production
chmod 600 .env.production
```

Set `APP_IMAGE` and `TOOLING_IMAGE` to the published versioned image references,
and fill in `POSTGRES_PASSWORD` and `NUXT_SESSION_PASSWORD`. Use separate random
secrets generated with `openssl rand -hex 32`. Configure the other PostgreSQL and
port values as needed; no `DATABASE_URL` is required for this deployment.

Pull and start the services using only the production file:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml pull
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
docker compose --env-file .env.production -f docker-compose.prod.yml ps -a
```

For private image repositories, run `docker login` on the VM before pulling.
Database readiness checks, automatic migrations, persistent storage, and the app
health check behave as in the build-based stack. Initial data and HTTPS proxy
configuration still need to be supplied as described above. Create the first
administrator with:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml \
  run --rm --no-deps migrate node scripts/admin.mjs create \
  --email admin@example.com --name "Administrator"
```

For a new release, publish both images with a new version, update both image
references in `.env.production`, then repeat `pull` and `up -d`. Keep the deployment
directory and Compose project name stable so releases reuse the database volume.

For deployments without Docker, generate the Prisma client, apply migrations,
build the app, and run `node .output/server/index.mjs` with production
`DATABASE_URL` and `NUXT_SESSION_PASSWORD` values.

Do not enable `ALLOW_PRODUCTION_SEED` unless intentionally loading development
data into the selected database.

## Project structure

```text
drive-hub/
├── app/
│   ├── assets/             # Global styles and visual assets
│   ├── components/         # Shared, admin, and manager UI
│   ├── composables/        # Client-side state and API workflows
│   ├── layouts/            # Nuxt layouts
│   ├── middleware/         # Client route guards
│   ├── pages/              # File-based application routes
│   ├── types/              # Client and presentation types
│   └── utils/              # Presentation and form helpers
├── docs/nuxt-learning/     # Project-specific Nuxt learning notes
├── prisma/
│   ├── migrations/         # Database migration history
│   ├── schema.prisma       # Domain and relationship model
│   ├── curriculum.mjs      # Licence curriculum definitions
│   └── seed.mjs            # Complete development seed
├── scripts/                # Administrator CLI utilities
├── server/
│   ├── api/                # Nitro HTTP endpoints
│   ├── repositories/       # Persistence operations
│   ├── routes/ws/          # WebSocket endpoint
│   ├── services/           # Business rules and transactions
│   ├── utils/              # Authorization, Prisma, and chat helpers
│   └── validation/         # Request schemas
├── shared/                 # Types and constants shared across runtimes
├── tests/                  # Unit, integration, and HTTP regression tests
├── docker/                 # Container startup configuration
├── Dockerfile              # Build, migration tooling, and production runtime
├── docker-compose.yml      # Complete production stack
├── docker-compose.dev.yml  # Host-side development database access
├── docker-compose.prod.yml # Standalone deployment using published images
├── .env.production.example # Public production configuration template
├── setup-vm.sh             # Automatic Ubuntu setup and image deployment
├── nuxt.config.ts          # Nuxt and Nitro configuration
└── package.json            # Dependencies and project commands
```

## Further documentation

The [`docs/nuxt-learning`](docs/nuxt-learning/README.md) collection explains
Nuxt fundamentals in the context of Drive Hub, including server rendering,
hydration, routing, data fetching, builds, Vue reactivity, and project
composables.

Useful upstream references:

- [Nuxt documentation](https://nuxt.com/docs)
- [Prisma documentation](https://www.prisma.io/docs)
- [nuxt-auth-utils documentation](https://github.com/atinux/nuxt-auth-utils)

## Authors

Drive Hub is authored and maintained by:

- [Bojana Jovancheva](https://github.com/bjovanceva)
- [Ljupcho Angelovski](https://github.com/Ljupce003)

See the repository's [commit history](https://github.com/bjovanceva/drive-hub/commits)
for the complete contribution record.
