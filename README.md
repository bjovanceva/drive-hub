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

The seed is transactional and idempotent. It populates 17 licence categories,
442 ordered curriculum lessons, five development schools and their category
connections, five role/context users, six vehicles, and sample applications in
each status. It updates records identified by their stable category/sequence,
email, code, registration, or application composite key instead of duplicating
them.

All development accounts use `SEED_DEFAULT_PASSWORD`, or `DriveHub123!` when
the variable is omitted:

| Context | Email |
| --- | --- |
| Applicant | `applicant@drivehub.test` |
| Student | `student@drivehub.test` |
| Instructor | `instructor@drivehub.test` |
| School manager | `manager@drivehub.test` |
| Global admin | `admin@drivehub.test` |

All accounts use `/login`; administrators land on `/administration`. The seed is
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
- `POST /api/auth/login` — signs in both `USER` and `ADMIN` accounts.
- `POST /api/auth/logout` — clears the current session.

Pages opt into route protection with `definePageMeta({ middleware: ... })`:

- `app/middleware/auth.ts` protects ordinary-user pages such as
  `/start-application`. Guests go to `/login?redirect=...`; administrators go to
  `/administration`.
- `app/middleware/admin.ts` protects `/administration`. Guests go to the shared
  login; ordinary users go to `/start-application`.
- `app/middleware/guest.ts` sends signed-in visitors away from login and
  registration to the landing page for their role.

Route constants live in `shared/constants/routes.ts`. After login,
administrators go to `/administration`; ordinary users follow a local return
path or default to `/start-application`. Registration always creates `USER`.

Backend access is enforced separately by helpers in
`server/utils/authorization.ts`: `requireOrdinaryUser`, `requireSchoolManager`,
and `requireAdmin`. They validate the session and current database role.
`/api/applications/context` uses the ordinary-user guard and
`/api/admin/context` uses the administrator guard. Public school reads accept
either role, while ordinary school managers retain their school restrictions.

Authorization is opt-in per endpoint. School creation, school deletion, and
the user-selection API require an administrator, including the legacy endpoints.

`UserRole` represents global access (`USER` or `ADMIN`). School-specific access
remains relational: a user may be connected to a school as a student,
instructor, or manager. This keeps future school dashboards and permissions
separate from the platform-wide admin role.

## Account settings

Ordinary users open `/profile` from their name in the header. They can update
their name and email or change their password. Email and password changes
require their current password. The account APIs check the database role and
derive the user ID from the session; requests cannot set roles or school
relationships. Successful saves refresh the current session and header.
Other existing sessions retain their cookies until logout or expiry.

Administrators have no profile page or account-settings API access. Their
header name is plain text; Administration is their navigation button.

## Administrator commands

Run these commands from the project directory. They load `DATABASE_URL` from
the environment or `.env` and prompt for a password and confirmation with
hidden input. Admin passwords have no strength requirements; they only need to
be non-empty and fit the sign-in form's 128-character limit.

```bash
npm run admin:create -- --email admin@example.com --name "Administrator"
npm run admin:update -- --email admin@example.com
npm run admin:update -- --email admin@example.com --new-email new-admin@example.com --name "New Administrator"
```

`admin:create` adds a new `ADMIN` identity with no school relationships.
`admin:update` preserves the existing admin's ID, updates the supplied name
and/or email, and replaces the password. It requires an existing `ADMIN`;
neither command converts or overwrites an ordinary user. Administrators are
excluded from school-manager selection and cannot be assigned by the school
creation API. No existing accounts are deleted by these commands.

For non-interactive use, supply `DRIVE_HUB_ADMIN_PASSWORD` through the process
environment. There is no default password or password CLI argument. Use
`npm run admin:create -- --help` for command help. These commands do not revoke
already-issued session cookies.

Run the focused account and administrator-command tests with
`npm run test:accounts` (Node 22.13+). The tests use in-memory repositories and
query doubles, so they do not modify the database.

## Administration panel

Open `/administration` as an administrator. Its three sections are:

- **Users:** search/filter accounts, create or edit ordinary users, reset their
  passwords, choose or remove one student, instructor, or manager school role,
  and delete accounts. Administrator identities are listed read-only and remain
  CLI-managed.
- **Schools:** create, edit and delete schools. Open a school to view and manage
  its manager, students, instructors, offered categories, vehicles and vehicle
  instructor assignments. A user can have only one school role at one school at a time.
- **Applicants:** filter applications by person, school or status; create, edit,
  approve, reject, cancel or delete an application. Approval enrolls its user
  at the selected school and creates the student's training enrollment. A
  preferred instructor is used when they have capacity; otherwise one eligible
  school instructor is chosen randomly. Active and paused enrollments reserve a
  place, and each instructor is limited to three distinct current students. A
  student at another school must be transferred in Users first. Managers and
  instructors must change roles in Users before approval. Rejecting or cancelling
  an approved application cancels its training; deleting the application preserves
  the training history.

All admin reads and writes check the current database role. Mutations use
serializable transactions. Changing an instructor's school clears their old
vehicle assignments, preferred-instructor links and active training assignments.
A manager cannot manage two schools. Changing a role in Users atomically removes
the previous role; assignment shortcuts reject conflicting roles. Categories used
by applications cannot be removed from a school until those applications are
updated or deleted.

## Training curriculum and progress

The backend schema separates reusable curriculum from student progress:

- `CurriculumLesson` defines an ordered theory or practical lesson for one
  licence category, including its title, concept, goal and planned duration.
  `(categoryId, sequence)` is unique.
- `TrainingEnrollment` is the actual approved student/school/category assignment.
  It stores the assigned instructor, an instructor-linked vehicle when one is
  available, lifecycle status and dates. The source application is optional so
  deleting administrative application data does not erase training history.
- `LessonSession` records the scheduled start/end, actual start/completion,
  status, notes, instructor and vehicle for one curriculum lesson attempt in one
  enrollment. Multiple attempts are retained rather than overwriting history.

The development seed publishes a complete lesson plan for all 17 categories.
Every curriculum row is one 45-minute teaching hour, and the generated theory
and practical counts exactly match the corresponding values stored on the
category. Repeated topics are labelled `(1/n)`, `(2/n)`, and so on. Category B,
for example, progresses from controls through proving-ground reversing,
turning, parking, uphill starts and precision stopping before urban, rural,
high-speed and independent road driving. Motorcycle, trailer, goods, passenger,
tractor, mobile-machinery and tram categories have their own safety checks,
manoeuvres and operating context.

The catalogue is realistic development data informed by the North Macedonian
exam structure and common European category competencies; it is not a claim of
regulatory accreditation. Update `prisma/curriculum.mjs` if a school needs to
mirror an approved local teaching plan. Run `npm run test:curriculum` to verify
coverage, counts and ordering without connecting to PostgreSQL.

Completed lesson count is the number of distinct lessons with a `COMPLETED`
session. The next lesson is
the lowest-sequence category lesson without a completed session for that
enrollment. Keeping these values derived avoids stale progress counters. The
manager dashboard can now schedule curriculum sessions and move scheduled
sessions to completed or cancelled states. Student and instructor progress is
derived immediately from those session records.

## Unified dashboard

Authenticated ordinary users can open `/dashboard`. The route resolves their
current school role and provides the shared entry point for student, instructor,
manager and applicant experiences. The student workspace includes:

- all current and historical training programmes;
- overall, theory and practical lesson progress;
- assigned school, instructor and vehicle;
- the next curriculum lesson and next scheduled booking;
- an expandable lesson plan with completed and scheduled attempts; and
- direct contact actions for the current driving school.

The instructor workspace contains the instructor's actual assigned sessions,
student roster, curriculum progress and vehicles. Theory sessions created
without an instructor do not appear on an assigned driving instructor's
schedule.

The manager workspace includes application approval with explicit instructor
assignment, instructor management, the complete school student roster, lesson
scheduling, and a searchable lesson ledger. Managers can filter lessons by
student, instructor, category and status, then complete, cancel or reschedule a
scheduled session. Completion becomes available only after the scheduled end;
rescheduling checks student, instructor and vehicle conflicts.

The `/api/dashboard` response is scoped from the authenticated database identity,
so a client cannot select another student's or school's ID. Every manager lesson
mutation verifies the signed-in manager's current school membership on the
server.

Deletion dialogs explain the impact. Deleting a user removes their applications
and clears manager/instructor references. Deleting a school removes its vehicles
and applications and unassigns its students and instructors, preserving the user
accounts. These deletions are permanent.

After schema changes, run `npm run db:generate` to refresh the generated Prisma
client. Migration `20260909120000_add_training_curriculum_and_progress` creates
the curriculum, training and lesson-session structures and backfills existing
approved applications. The earlier
`20260904143000_ensure_application_instructor_relation` migration adds the
nullable preferred-instructor column, foreign key and index if missing. The two
historical authentication migrations retain the names recorded by existing
databases and are ordered so the same history also works on a clean database.

`npm run test:admin` runs integration tests against `DATABASE_URL` in a randomly
named disposable schema, applying migrations there and removing it afterward.
It verifies CRUD, relationship rules, approval, transaction rollback and deletion
cleanup without modifying public tables. The database account needs permission
to create schemas. `npm run test:accounts` runs the existing account checks.

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

### Admin code organization and checks

`app/pages/administration.vue` handles navigation and composes the section panels.
`app/components/admin/` contains the user, school, applicant, and school-detail
views; `forms/` contains a typed form for each resource. `AdminModal` handles native
dialog behavior and focus restoration. `useAdminWorkspace` owns loading, saves,
deletions, pending state, and errors. Form initialization and display helpers live
in `app/utils/admin/`. Applicant school filters are stored in the URL.

On the server, `AdminService` coordinates transactions, with resource rules in
`server/services/admin/`. The membership endpoint updates only the requested
student/instructor relationship, preserving other account fields. Admin API
handlers still check the current database role before every operation.

Run `npm run typecheck`, `npm run build`, `npm run test:accounts`, and
`npm run test:admin` before changing this flow. Database tests import the actual
services, inject a disposable database and password hasher, and verify relationship
cleanup, rollback, access restrictions, and preservation of unrelated fields.

### Admin route regression checks

Run `npm run build && npm run test:admin:http` to exercise the real Nitro server
with authenticated HTTP requests. This suite verifies every resource's create,
edit and delete routes, membership assignment, application approval, exclusive
school roles, and guest/ordinary-user access denial. It uses a temporary local
port and a disposable PostgreSQL schema, and removes both afterward. The database
connection supports the standard `schema` query parameter in `DATABASE_URL`.

Keep all resource routes under `server/api/admin/[resource]/`, including
`[id]/membership.patch.ts` (validated for users only). A separate static `users/`
branch can take routing precedence and hide generic user edit/delete endpoints.
