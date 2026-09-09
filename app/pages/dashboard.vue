<script setup lang="ts">
import type { DashboardLesson, DashboardResponse, TrainingStatus } from '~/types/dashboard'
import { userRoutes } from '#shared/constants/routes'

definePageMeta({ layout: 'default', middleware: 'auth' })
useSeoMeta({ title: 'Dashboard | Drive Hub' })

const { user } = useUserSession()
const { data, error, status, refresh } = await useFetch<DashboardResponse>('/api/dashboard')
const userName = computed(() => user.value?.name || 'driver')
const studentDashboard = computed(() => (data.value?.view === 'STUDENT' ? data.value : null))
const hasCurrentTraining = computed(() =>
  studentDashboard.value?.trainings.some(
    (training) => training.status === 'ACTIVE' || training.status === 'PAUSED'
  )
)
const supportTraining = computed(() =>
  studentDashboard.value?.trainings.find(
    (training) => training.status === 'ACTIVE' || training.status === 'PAUSED'
  )
)
const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Skopje'
})
const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Europe/Skopje'
})

function formatDateTime(value: string | null) {
  return value ? dateTimeFormatter.format(new Date(value)) : 'Not scheduled'
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value))
}

function readableStatus(value: TrainingStatus) {
  return value.charAt(0) + value.slice(1).toLowerCase()
}

function latestSession(lesson: DashboardLesson) {
  return lesson.sessions[0] ?? null
}
</script>

<template>
  <div class="dh-dashboard">
    <header class="dh-dashboard__hero">
      <div class="dh-dashboard__shell dh-dashboard__hero-inner">
        <div>
          <p class="dh-dashboard__eyebrow">Drive Hub / Dashboard</p>
          <h1>Your road ahead</h1>
          <p class="dh-dashboard__intro">
            Welcome back, {{ userName }}. Track every lesson and
            see what comes next.
          </p>
        </div>
        <span v-if="data?.view" class="dh-dashboard__role">
          {{ data.view === 'APPLICANT' ? 'Applicant' : data.view.toLowerCase() }} dashboard
        </span>
      </div>
    </header>

    <main class="dh-dashboard__shell dh-dashboard__body">
      <section v-if="error" class="dh-dashboard__empty" aria-labelledby="dashboard-error-title">
        <p class="dh-dashboard__empty-kicker">Connection interrupted</p>
        <h2 id="dashboard-error-title">We couldn’t load your dashboard</h2>
        <p>Your data is safe. Try loading it again.</p>
        <button type="button" @click="refresh()">Try again</button>
      </section>

      <section v-else-if="status === 'pending' && !data" class="dh-dashboard__loading" role="status">
        <span aria-hidden="true" />
        Loading your training…
      </section>

      <template v-else-if="studentDashboard">
        <section class="dh-dashboard__summary" aria-label="Training summary">
          <article>
            <span>Current programmes</span>
            <strong>{{ studentDashboard.summary.currentTrainings }}</strong>
            <small>Active or paused</small>
          </article>
          <article>
            <span>Lessons completed</span>
            <strong>{{ studentDashboard.summary.completedLessons }}</strong>
            <small>Across all programmes</small>
          </article>
          <article class="dh-dashboard__summary-next">
            <span>Next scheduled lesson</span>
            <strong>{{ formatDateTime(studentDashboard.summary.nextSessionAt) }}</strong>
            <small>{{ studentDashboard.summary.nextSessionAt ? 'Europe/Skopje time' : 'Nothing booked yet' }}</small>
          </article>
        </section>

        <section v-if="studentDashboard.trainings.length" class="dh-dashboard__programmes" aria-labelledby="programmes-title">
          <div class="dh-dashboard__section-heading">
            <div>
              <p>Training record</p>
              <h2 id="programmes-title">Your programmes</h2>
            </div>
            <span>{{ studentDashboard.trainings.length }} total</span>
          </div>

          <article v-for="training in studentDashboard.trainings" :key="training.id" class="dh-training">
            <header class="dh-training__header">
              <div class="dh-training__category-mark">{{ training.category.code || '—' }}</div>
              <div class="dh-training__title">
                <p>{{ training.school.name }}</p>
                <h3>{{ training.category.name }}</h3>
              </div>
              <span class="dh-training__status" :class="`dh-training__status--${training.status.toLowerCase()}`">
                {{ readableStatus(training.status) }}
              </span>
            </header>

            <div class="dh-training__content">
              <section class="dh-training__progress" aria-label="Lesson progress">
                <div class="dh-training__progress-copy">
                  <div>
                    <span>Overall progress</span>
                    <strong>{{ training.progress.percentage }}%</strong>
                  </div>
                  <p>
                    {{ training.progress.completedLessons }} of
                    {{ training.progress.requiredLessons }} required lessons complete
                  </p>
                </div>
                <div
                  class="dh-training__progress-track"
                  role="progressbar"
                  aria-label="Overall lesson progress"
                  :aria-valuenow="training.progress.percentage"
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  <span :style="{ width: `${training.progress.percentage}%` }" />
                </div>
                <div class="dh-training__breakdown">
                  <div>
                    <span>Theory</span>
                    <strong>{{ training.progress.theory.completed }} / {{ training.progress.theory.required }}</strong>
                  </div>
                  <div>
                    <span>Practical</span>
                    <strong>{{ training.progress.practical.completed }} / {{ training.progress.practical.required }}</strong>
                  </div>
                  <div>
                    <span>Curriculum ready</span>
                    <strong>{{ training.progress.definedLessons }} lessons</strong>
                  </div>
                </div>
              </section>

              <aside class="dh-training__assignment" aria-label="Training assignment">
                <dl>
                  <div>
                    <dt>Instructor</dt>
                    <dd>{{ training.instructor?.name || 'Awaiting assignment' }}</dd>
                  </div>
                  <div>
                    <dt>Vehicle</dt>
                    <dd v-if="training.vehicle">
                      {{ training.vehicle.brand }} {{ training.vehicle.model }}
                      <small>{{ training.vehicle.registration }}</small>
                    </dd>
                    <dd v-else>Assigned per lesson</dd>
                  </div>
                  <div>
                    <dt>Started</dt>
                    <dd>{{ formatDate(training.startedAt) }}</dd>
                  </div>
                  <div>
                    <dt>Location</dt>
                    <dd>{{ training.school.city || 'Not specified' }}</dd>
                  </div>
                </dl>
              </aside>
            </div>

            <div class="dh-training__next-row">
              <section class="dh-training__next" aria-labelledby="next-lesson-title">
                <p>Next in your curriculum</p>
                <template v-if="training.nextLesson">
                  <div class="dh-training__lesson-number">{{ String(training.nextLesson.sequence).padStart(2, '0') }}</div>
                  <div>
                    <span>{{ training.nextLesson.type.toLowerCase() }} · {{ training.nextLesson.durationMinutes }} min</span>
                    <h4 id="next-lesson-title">{{ training.nextLesson.title }}</h4>
                    <p>{{ training.nextLesson.goal }}</p>
                  </div>
                </template>
                <div v-else class="dh-training__curriculum-empty">
                  <h4 id="next-lesson-title">
                    {{ training.progress.completedLessons >= training.progress.requiredLessons && training.progress.requiredLessons > 0
                      ? 'Curriculum completed' : 'Curriculum being prepared' }}
                  </h4>
                  <p>Your school will publish the next lesson details here.</p>
                </div>
              </section>
              <section class="dh-training__booking" aria-label="Next booking">
                <p>Next booking</p>
                <template v-if="training.upcomingSession">
                  <strong>{{ formatDateTime(training.upcomingSession.scheduledStart) }}</strong>
                  <span>{{ training.upcomingSession.instructor?.name || training.instructor?.name || 'Instructor pending' }}</span>
                </template>
                <template v-else>
                  <strong>Not scheduled</strong>
                  <span>Your school will confirm your next time.</span>
                </template>
              </section>
            </div>

            <details class="dh-training__lessons">
              <summary>
                <span>View lesson plan</span>
                <small>{{ training.lessons.length }} defined lessons</small>
              </summary>
              <div v-if="training.lessons.length" class="dh-training__lesson-list">
                <article v-for="lesson in training.lessons" :key="lesson.id" :class="{ 'is-complete': lesson.completed }">
                  <div class="dh-training__lesson-state" aria-hidden="true">
                    {{ lesson.completed ? '✓' : String(lesson.sequence).padStart(2, '0') }}
                  </div>
                  <div class="dh-training__lesson-copy">
                    <span>{{ lesson.type.toLowerCase() }} · {{ lesson.durationMinutes }} min</span>
                    <h4>{{ lesson.title }}</h4>
                    <p>{{ lesson.concept }}</p>
                  </div>
                  <div class="dh-training__lesson-date">
                    <template v-if="latestSession(lesson)">
                      <span>{{ latestSession(lesson)?.status.toLowerCase() }}</span>
                      <strong>{{ formatDateTime(latestSession(lesson)?.scheduledStart || null) }}</strong>
                    </template>
                    <span v-else>Not scheduled</span>
                  </div>
                </article>
              </div>
              <p v-else class="dh-training__no-lessons">
                The detailed lesson plan has not been published for this category yet.
              </p>
            </details>
          </article>
        </section>

        <section v-else class="dh-dashboard__empty" aria-labelledby="no-training-title">
          <p class="dh-dashboard__empty-kicker">Ready when you are</p>
          <h2 id="no-training-title">No training programme yet</h2>
          <p>Once a school approves your application, your instructor, lessons and progress will appear here.</p>
          <NuxtLink :to="userRoutes.startApplication">Start an application →</NuxtLink>
        </section>

        <aside v-if="hasCurrentTraining" class="dh-dashboard__support">
          <div>
            <span>Need to change a booking?</span>
            <p>Contact your driving school directly. Online rescheduling will be added with the instructor tools.</p>
          </div>
          <div v-if="supportTraining" class="dh-dashboard__support-actions">
            <a :href="`tel:${supportTraining.school.phone}`">Call school</a>
            <a :href="`mailto:${supportTraining.school.email}`">Email school</a>
          </div>
        </aside>
      </template>

      <section v-else-if="data" class="dh-dashboard__empty" aria-labelledby="future-dashboard-title">
        <p class="dh-dashboard__empty-kicker">Dashboard foundation ready</p>
        <h2 id="future-dashboard-title">
          {{ data.view === 'INSTRUCTOR' ? 'Instructor tools are next' : data.view === 'MANAGER' ? 'Manager tools are next' : 'Your training starts after approval' }}
        </h2>
        <p v-if="data.view === 'APPLICANT'">
          Apply to a driving school now. Your lessons and progress will appear here after approval.
        </p>
        <p v-else>
          This unified dashboard recognizes your role. Its dedicated workspace will be added in the next phase.
        </p>
        <NuxtLink v-if="data.view === 'APPLICANT'" :to="userRoutes.startApplication">Start an application →</NuxtLink>
      </section>
    </main>
  </div>
</template>

<style scoped>
.dh-dashboard { min-height: 100%; background: var(--dh-color-bg-page); }
.dh-dashboard__shell { width: min(100%, 90rem); margin-inline: auto; }
.dh-dashboard__hero { position: relative; overflow: hidden; background: var(--dh-color-bg-inverse); color: white; }
.dh-dashboard__hero::after { position: absolute; right: -5rem; bottom: -5rem; width: 25rem; height: 12rem; border: 1px solid #41484f; content: ''; transform: skewX(-28deg); }
.dh-dashboard__hero-inner { position: relative; z-index: 1; display: flex; min-height: 20rem; padding: 4.5rem 6rem; align-items: flex-end; justify-content: space-between; gap: 3rem; }
.dh-dashboard__eyebrow, .dh-dashboard__section-heading p, .dh-dashboard__empty-kicker { margin: 0; color: var(--dh-color-bg-status); font-size: 0.75rem; font-weight: 800; letter-spacing: 0.09rem; text-transform: uppercase; }
.dh-dashboard h1 { max-width: 48rem; margin: 0.75rem 0 1rem; font-family: 'Barlow Condensed', sans-serif; font-size: clamp(3.75rem, 8vw, 7rem); line-height: 0.86; letter-spacing: -0.08rem; text-transform: uppercase; }
.dh-dashboard__intro { max-width: 38rem; margin: 0; color: #c8ced4; font-size: 1rem; line-height: 1.65; }
.dh-dashboard__role { flex: 0 0 auto; padding: 0.75rem 1rem; border: 1px solid var(--dh-color-bg-status); color: var(--dh-color-bg-status); font-size: 0.75rem; font-weight: 800; letter-spacing: 0.06rem; text-transform: uppercase; }
.dh-dashboard__body { padding: 0 6rem 5rem; }
.dh-dashboard__summary { display: grid; margin-top: -2.5rem; position: relative; z-index: 2; grid-template-columns: repeat(3, minmax(0, 1fr)); border: 1px solid var(--dh-color-border-strong); background: white; }
.dh-dashboard__summary article { display: flex; min-height: 10rem; padding: 1.5rem 1.75rem; flex-direction: column; justify-content: space-between; border-right: 1px solid var(--dh-color-border-default); }
.dh-dashboard__summary article:last-child { border-right: 0; }
.dh-dashboard__summary span, .dh-training__progress-copy span, .dh-training__breakdown span { color: var(--dh-color-text-secondary); font-size: 0.7rem; font-weight: 800; letter-spacing: 0.055rem; text-transform: uppercase; }
.dh-dashboard__summary strong { font-family: 'Barlow Condensed', sans-serif; font-size: 3rem; line-height: 1; text-transform: uppercase; }
.dh-dashboard__summary-next strong { font-size: clamp(1.5rem, 2.4vw, 2.25rem); }
.dh-dashboard__summary small { color: var(--dh-color-text-secondary); font-size: 0.75rem; }
.dh-dashboard__programmes { padding-top: 4rem; }
.dh-dashboard__section-heading { display: flex; margin-bottom: 1.5rem; align-items: end; justify-content: space-between; gap: 2rem; }
.dh-dashboard__section-heading h2 { margin: 0.25rem 0 0; font-family: 'Barlow Condensed', sans-serif; font-size: clamp(2.5rem, 5vw, 4rem); line-height: 1; text-transform: uppercase; }
.dh-dashboard__section-heading > span { padding-bottom: 0.35rem; color: var(--dh-color-text-secondary); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
.dh-training { margin-bottom: 2rem; border: 1px solid var(--dh-color-border-strong); background: white; }
.dh-training__header { display: grid; min-height: 6rem; grid-template-columns: 6rem 1fr auto; align-items: center; border-bottom: 1px solid var(--dh-color-border-strong); }
.dh-training__category-mark { display: grid; align-self: stretch; place-items: center; background: var(--dh-color-bg-status); font-family: 'Barlow Condensed', sans-serif; font-size: 2.5rem; font-weight: 800; }
.dh-training__title { min-width: 0; padding: 1rem 1.5rem; }
.dh-training__title p { margin: 0 0 0.25rem; color: var(--dh-color-text-secondary); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
.dh-training__title h3 { margin: 0; font-family: 'Barlow Condensed', sans-serif; font-size: 2rem; line-height: 1; text-transform: uppercase; }
.dh-training__status { margin-right: 1.5rem; padding: 0.55rem 0.8rem; border: 1px solid var(--dh-color-border-default); font-size: 0.7rem; font-weight: 800; letter-spacing: 0.04rem; text-transform: uppercase; }
.dh-training__status--active { border-color: #85aa1e; background: #eff9d2; color: #345000; }
.dh-training__status--paused { background: #fff5d6; color: #6d4c00; }
.dh-training__status--completed { background: #e1f4ef; color: #175749; }
.dh-training__status--cancelled { background: #f1f1f1; color: #5a6269; }
.dh-training__content { display: grid; grid-template-columns: minmax(0, 1.65fr) minmax(18rem, 0.8fr); }
.dh-training__progress { padding: 2rem; border-right: 1px solid var(--dh-color-border-default); }
.dh-training__progress-copy { display: flex; align-items: end; justify-content: space-between; gap: 2rem; }
.dh-training__progress-copy div { display: flex; align-items: baseline; gap: 0.75rem; }
.dh-training__progress-copy strong { font-family: 'Barlow Condensed', sans-serif; font-size: 3.5rem; line-height: 1; }
.dh-training__progress-copy p { margin: 0 0 0.35rem; color: var(--dh-color-text-secondary); font-size: 0.8125rem; }
.dh-training__progress-track { height: 0.75rem; margin: 1.35rem 0 1.5rem; overflow: hidden; background: #dfe3e5; }
.dh-training__progress-track span { display: block; height: 100%; background: var(--dh-color-bg-status); transition: width 400ms ease; }
.dh-training__breakdown { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
.dh-training__breakdown div { display: flex; flex-direction: column; gap: 0.35rem; }
.dh-training__breakdown strong { font-size: 0.95rem; }
.dh-training__assignment { padding: 2rem; background: #f7f8f7; }
.dh-training__assignment dl { display: grid; margin: 0; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.5rem 1rem; }
.dh-training__assignment dt { margin-bottom: 0.4rem; color: var(--dh-color-text-secondary); font-size: 0.65rem; font-weight: 800; letter-spacing: 0.05rem; text-transform: uppercase; }
.dh-training__assignment dd { margin: 0; font-size: 0.875rem; font-weight: 700; line-height: 1.35; }
.dh-training__assignment dd small { display: block; margin-top: 0.2rem; color: var(--dh-color-text-secondary); font-size: 0.7rem; font-weight: 500; }
.dh-training__next-row { display: grid; grid-template-columns: minmax(0, 1.65fr) minmax(18rem, 0.8fr); border-top: 1px solid var(--dh-color-border-default); }
.dh-training__next { display: grid; min-height: 11rem; padding: 1.75rem 2rem; grid-template-columns: 5rem 1fr; align-items: center; gap: 1.25rem; border-right: 1px solid var(--dh-color-border-default); }
.dh-training__next > p { grid-column: 1 / -1; align-self: start; margin: 0 0 -1rem; color: var(--dh-color-text-secondary); font-size: 0.7rem; font-weight: 800; letter-spacing: 0.05rem; text-transform: uppercase; }
.dh-training__lesson-number { font-family: 'Barlow Condensed', sans-serif; font-size: 4rem; font-weight: 800; line-height: 1; -webkit-text-stroke: 1px var(--dh-color-text-primary); color: transparent; }
.dh-training__next span { color: #657f17; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
.dh-training__next h4 { margin: 0.3rem 0; font-family: 'Barlow Condensed', sans-serif; font-size: 1.75rem; text-transform: uppercase; }
.dh-training__next div p { margin: 0; color: var(--dh-color-text-secondary); font-size: 0.8125rem; line-height: 1.55; }
.dh-training__curriculum-empty { grid-column: 1 / -1; }
.dh-training__booking { display: flex; padding: 1.75rem 2rem; flex-direction: column; justify-content: center; background: var(--dh-color-bg-inverse); color: white; }
.dh-training__booking p { margin: 0 0 1rem; color: var(--dh-color-bg-status); font-size: 0.7rem; font-weight: 800; letter-spacing: 0.05rem; text-transform: uppercase; }
.dh-training__booking strong { font-family: 'Barlow Condensed', sans-serif; font-size: 1.75rem; line-height: 1.1; text-transform: uppercase; }
.dh-training__booking span { margin-top: 0.6rem; color: #c8ced4; font-size: 0.75rem; }
.dh-training__lessons { border-top: 1px solid var(--dh-color-border-strong); }
.dh-training__lessons summary { display: flex; min-height: 4rem; padding: 1rem 1.5rem; align-items: center; justify-content: space-between; gap: 1rem; cursor: pointer; font-size: 0.8rem; font-weight: 800; letter-spacing: 0.04rem; text-transform: uppercase; }
.dh-training__lessons summary:hover { background: #f5f6f5; }
.dh-training__lessons summary small { color: var(--dh-color-text-secondary); font-size: 0.68rem; }
.dh-training__lesson-list { border-top: 1px solid var(--dh-color-border-default); }
.dh-training__lesson-list article { display: grid; min-height: 6rem; padding: 1rem 1.5rem; grid-template-columns: 3rem 1fr auto; align-items: center; gap: 1rem; border-bottom: 1px solid #e2e5e6; }
.dh-training__lesson-list article:last-child { border-bottom: 0; }
.dh-training__lesson-list article.is-complete { background: #f7faef; }
.dh-training__lesson-state { display: grid; width: 2.25rem; height: 2.25rem; place-items: center; border: 1px solid var(--dh-color-border-strong); font-family: 'Barlow Condensed', sans-serif; font-weight: 800; }
.is-complete .dh-training__lesson-state { border-color: #74961b; background: var(--dh-color-bg-status); }
.dh-training__lesson-copy span, .dh-training__lesson-date span { color: var(--dh-color-text-secondary); font-size: 0.65rem; font-weight: 800; text-transform: uppercase; }
.dh-training__lesson-copy h4 { margin: 0.2rem 0; font-size: 0.9rem; }
.dh-training__lesson-copy p { margin: 0; color: var(--dh-color-text-secondary); font-size: 0.75rem; }
.dh-training__lesson-date { display: flex; max-width: 14rem; flex-direction: column; align-items: flex-end; gap: 0.25rem; text-align: right; }
.dh-training__lesson-date strong { font-size: 0.75rem; }
.dh-training__no-lessons { margin: 0; padding: 2rem; border-top: 1px solid var(--dh-color-border-default); color: var(--dh-color-text-secondary); font-size: 0.875rem; }
.dh-dashboard__support { display: flex; margin-top: 2rem; padding: 1.25rem 1.5rem; align-items: center; justify-content: space-between; gap: 2rem; border-left: 0.35rem solid var(--dh-color-bg-status); background: white; }
.dh-dashboard__support span { font-family: 'Barlow Condensed', sans-serif; font-size: 1.35rem; font-weight: 700; text-transform: uppercase; }
.dh-dashboard__support p { margin: 0.25rem 0 0; color: var(--dh-color-text-secondary); font-size: 0.8rem; }
.dh-dashboard__support-actions { display: flex; flex: 0 0 auto; gap: 0.75rem; }
.dh-dashboard__support-actions a { padding: 0.65rem 0.85rem; border: 1px solid var(--dh-color-border-strong); color: var(--dh-color-text-primary); font-size: 0.7rem; font-weight: 800; text-decoration: none; text-transform: uppercase; }
.dh-dashboard__support-actions a:hover { background: var(--dh-color-bg-status); }
.dh-dashboard__empty { margin: 4rem auto 0; padding: 3rem; border: 1px solid var(--dh-color-border-strong); background: white; text-align: center; }
.dh-dashboard__empty-kicker { color: #657f17; }
.dh-dashboard__empty h2 { margin: 0.75rem 0; font-family: 'Barlow Condensed', sans-serif; font-size: clamp(2.5rem, 6vw, 4rem); line-height: 1; text-transform: uppercase; }
.dh-dashboard__empty > p:not(.dh-dashboard__empty-kicker) { max-width: 38rem; margin: 0 auto 1.5rem; color: var(--dh-color-text-secondary); line-height: 1.6; }
.dh-dashboard__empty a, .dh-dashboard__empty button { display: inline-flex; min-height: 3rem; padding: 0.75rem 1.25rem; align-items: center; border: 1px solid var(--dh-color-border-strong); background: var(--dh-color-bg-status); color: var(--dh-color-text-primary); font-weight: 800; text-decoration: none; cursor: pointer; }
.dh-dashboard__loading { display: flex; min-height: 20rem; align-items: center; justify-content: center; gap: 0.75rem; color: var(--dh-color-text-secondary); }
.dh-dashboard__loading span { width: 0.8rem; height: 0.8rem; background: var(--dh-color-bg-status); animation: dh-dashboard-pulse 900ms infinite alternate; }
@keyframes dh-dashboard-pulse { to { opacity: 0.25; transform: scale(0.75); } }
@media (max-width: 70rem) { .dh-dashboard__hero-inner, .dh-dashboard__body { padding-inline: 2rem; } }
@media (max-width: 56rem) { .dh-dashboard__summary { grid-template-columns: 1fr; } .dh-dashboard__summary article { min-height: 7rem; border-right: 0; border-bottom: 1px solid var(--dh-color-border-default); } .dh-dashboard__summary article:last-child { border-bottom: 0; } .dh-training__content, .dh-training__next-row { grid-template-columns: 1fr; } .dh-training__progress, .dh-training__next { border-right: 0; border-bottom: 1px solid var(--dh-color-border-default); } }
@media (max-width: 40rem) { .dh-dashboard__hero-inner { min-height: 18rem; padding: 3rem 1.25rem; flex-direction: column; align-items: flex-start; justify-content: flex-end; } .dh-dashboard__body { padding-inline: 1.25rem; } .dh-dashboard__summary { margin-top: -1.5rem; } .dh-training__header { grid-template-columns: 4.5rem 1fr; } .dh-training__status { grid-column: 1 / -1; margin: 0; text-align: center; border-width: 1px 0 0; } .dh-training__progress, .dh-training__assignment, .dh-training__next, .dh-training__booking { padding: 1.25rem; } .dh-training__progress-copy { align-items: flex-start; flex-direction: column; gap: 0.5rem; } .dh-training__breakdown, .dh-training__assignment dl { grid-template-columns: 1fr 1fr; } .dh-training__next { grid-template-columns: 3.5rem 1fr; } .dh-training__lesson-list article { grid-template-columns: 2.5rem 1fr; } .dh-training__lesson-date { grid-column: 2; align-items: flex-start; text-align: left; } .dh-dashboard__support { align-items: flex-start; flex-direction: column; gap: 0.75rem; } .dh-dashboard__support-actions { width: 100%; } .dh-dashboard__support-actions a { flex: 1; text-align: center; } }
@media (prefers-reduced-motion: reduce) { .dh-training__progress-track span { transition: none; } .dh-dashboard__loading span { animation: none; } }
</style>
