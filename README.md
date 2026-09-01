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

After applying the Prisma migrations and configuring `DATABASE_URL`, seed or
refresh the 17 licence categories with:

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
