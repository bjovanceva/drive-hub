# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Database seed

After applying the Prisma migrations and configuring `DATABASE_URL`, create or
refresh the complete development dataset with:

```bash
npm run db:seed
```

The seed is transactional and idempotent. It populates every current domain
table: 17 licence categories, five development schools and their category
connections, five role/context users, six vehicles, and sample applications in
each status. It updates records identified by their stable email, code,
registration, or application composite key instead of duplicating them.

All development accounts use `SEED_DEFAULT_PASSWORD`, or `DriveHub123!` when
the variable is omitted:

| Context | Email |
| --- | --- |
| Applicant | `applicant@drivehub.test` |
| Student | `student@drivehub.test` |
| Instructor | `instructor@drivehub.test` |
| School manager | `manager@drivehub.test` |
| Global admin | `admin@drivehub.test` |

The public login intentionally rejects the global admin account. The seed is
blocked when `NODE_ENV=production` unless `ALLOW_PRODUCTION_SEED=true` is set
explicitly.

To refresh only the 17 licence categories, use:

```bash
npm run db:seed:categories
```

The command executes [`prisma/seed-categories.sql`](prisma/seed-categories.sql).
It is idempotent: existing category rows are updated by their unique `code`,
while missing rows are inserted.

## Driving-school data

Client pages access `/api/driving-schools` through `useDrivingSchools()`. The
composable exposes reactive fetch state plus `createDrivingSchool(input)` and
`deleteDrivingSchool(id)` mutations; successful mutations refresh the active
school query automatically.

The home and school-directory search forms share `useSchoolSearchOptions()`,
which loads category codes and stored school cities from `/api/search-options`.
Concrete dropdown choices therefore come from PostgreSQL rather than page data.

## Authentication

Authentication uses `nuxt-auth-utils` cookie sessions. Copy `.env.example` to
`.env` and set `NUXT_SESSION_PASSWORD` to a random value with at least 32
characters before running the application outside local development.

The public authentication endpoints are:

- `POST /api/auth/register` — creates an ordinary `USER` account and starts a
  session. The request cannot choose a role.
- `POST /api/auth/login` — signs in ordinary users. `ADMIN` accounts are
  rejected because they are reserved for the future admin panel.
- `POST /api/auth/logout` — clears the current session.

`/start-application` is the first protected page. Its page middleware redirects
guests to `/login`, while `/api/applications/context` independently validates
the server session and current database role.

`UserRole` represents global access (`USER` or `ADMIN`). School-specific access
remains relational: a user may be connected to a school as a student,
instructor, or manager. This keeps future school dashboards and permissions
separate from the platform-wide admin role.

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
