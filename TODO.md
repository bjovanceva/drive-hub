# Drive Hub roadmap

## 1. Security and backend foundations

- [ ] Protect `POST /api/driving-schools` and `DELETE /api/driving-schools/:id`.
  Public users should only be able to read school data; creation and deletion
  belong in the future global-admin or school-management areas.
- [ ] Remove or protect `/api/test-db` before deployment.
- [ ] Add reusable server authorization helpers for global admins, students,
  instructors, and school managers. Every protected API must verify the current
  database role and that the requested resource belongs to the correct school.
- [ ] Add Zod validation and consistent error responses to every mutating API,
  including the existing driving-school endpoints.
- [ ] Decide whether one manager per school is enough. If a school can have
  multiple administrators, replace the single `managerId` relation with a
  school-membership model and a school-specific role enum.
- [ ] Decide whether a user may belong to multiple schools or have more than one
  school role. The current schema supports one student school, one instructor
  school, and at most one managed school.

## 2. Seed and development data

- [x] Add an idempotent development seed for driving schools and connect each
  school to the categories it offers.
- [x] Seed clearly marked development accounts for an ordinary applicant,
  student, instructor, school manager, and global admin.
- [x] Hash all seeded passwords and document development-only credentials
  without reusing them in production.
- [x] Add representative pending, approved, rejected, and cancelled applications
  for development and future workflow testing.

## 3. Application domain and database model

- [ ] Rework the current `@@unique([userId, drivingSchoolId, categoryId])`
  constraint. It currently prevents a user from ever applying again after a
  rejected or cancelled application; the required rule is to block only an
  active/pending application to the same school.
- [ ] Decide whether one user may apply to several schools simultaneously and
  document the exact duplicate-application rule.
- [ ] Add application lifecycle fields such as `updatedAt`, `reviewedAt`,
  `reviewedBy`, and an optional rejection/cancellation reason.
- [ ] Implement application status transitions and reject invalid transitions
  on the server.
- [ ] Approve an application in a database transaction that also connects the
  user as a student of that school. Prevent approval if the user already belongs
  to an incompatible school or programme.
- [ ] Define what happens to a student's other pending applications after one is
  approved.

## 4. Application workflow

- [ ] Replace the placeholder `/start-application` content with an application
  form that selects a school and one of the categories offered by that school.
- [ ] Carry the selected school/category from category cards and school cards
  into the application page through validated query parameters or route params.
- [ ] Add protected APIs for creating, listing, viewing, and cancelling the
  current user's applications.
- [ ] Display application history and current status to the applicant, with
  loading, empty, success, and error states.
- [ ] Prevent an application to the same school while another relevant
  application is pending, and explain the reason in the UI.
- [ ] Add school-manager APIs for listing, approving, and rejecting applications
  only for the manager's own school.

## 5. Lessons, scheduling, and progress model

- [ ] Add database models for enrolment, theory/practical lessons, appointments,
  attendance, completion status, and category-specific progress.
- [ ] Define who can create, reschedule, complete, or cancel an appointment and
  enforce those permissions on the server.
- [ ] Prevent scheduling conflicts for students, instructors, and vehicles.
- [ ] Calculate progress from completed required lessons instead of storing only
  a manually editable percentage.
- [ ] Define the completed-course state and whether the school can schedule an
  additional exam appointment.

## 6. Shared school dashboard

- [ ] Create one protected school dashboard route and return a server-derived
  school context for the signed-in user.
- [ ] Show common school information to every school member, then render
  role-specific navigation and components on the same route.
- [ ] Student view: own lesson schedule, attendance, completed lessons, remaining
  requirements, and overall progress.
- [ ] Instructor view: own schedule, assigned students, each student's progress,
  and permitted lesson/appointment actions.
- [ ] School-manager view: school-wide progress, schedules, instructors,
  students, applications, vehicles, and permitted management actions.
- [ ] Never rely only on conditionally hidden frontend components; apply the same
  role and school checks to every backing API.

## 7. School management area

- [ ] Manage the school's profile and category offerings.
- [ ] Invite, assign, update, and remove instructors and students without giving
  school managers global-admin privileges.
- [ ] Manage vehicles and instructor/vehicle assignments.
- [ ] Manage applications, enrolments, lesson requirements, and schedules.
- [ ] Add pagination, filtering, confirmation dialogs, and an audit trail for
  sensitive management actions.

## 8. Global admin panel

- [ ] Build a separate `/admin` layout, login page, route middleware, and
  server-side `ADMIN` authorization. Do not reuse the ordinary-user login UI.
- [ ] Manage platform users and global roles, while keeping school-specific roles
  separate.
- [ ] Review and manage school registrations, school managers, categories, and
  platform-wide data.
- [ ] Add safeguards against deleting the last admin, self-demotion, and deleting
  records with active relations.
- [ ] Record an audit log for admin changes.

## 9. Authentication hardening

- [ ] Add login/register rate limiting and protection against automated password
  guessing.
- [ ] Add email verification, forgotten-password, and password-reset flows.
- [ ] Add account/profile management and a change-password flow that requires the
  current password.
- [ ] Define session revocation behavior after password or role changes and add a
  way to sign out other sessions if needed.
- [ ] Verify production cookie, HTTPS, proxy, origin/CSRF, and session-secret
  configuration before deployment.

## 10. Quality and delivery

- [ ] Add automated tests for auth services/routes, authorization helpers,
  application constraints and transitions, and the school-role permission
  matrix.
- [ ] Add end-to-end tests for register, login, logout, protected redirects,
  application submission, approval, and role-specific dashboards.
- [ ] Add CI checks for formatting, type checking, tests, Prisma validation, and
  the production build.
- [ ] Add accessible form labels, keyboard/focus behavior, and complete loading,
  empty, error, and success states to all new pages.
- [ ] Decide whether the public and dashboard UI will support Macedonian and
  English, then centralize user-facing text if localization is required.
- [ ] Resolve or formally assess the current Prisma/deepmerge npm security
  advisory before production instead of applying the suggested unsafe downgrade.
- [ ] Document production migrations, seeding, backups, logging, and deployment
  environment variables.
