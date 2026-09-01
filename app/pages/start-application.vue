<script lang="ts" setup>
import { authRoutes } from '#shared/constants/routes'

definePageMeta({ layout: 'default', middleware: 'auth' })

useSeoMeta({
  title: 'Start application | Drive Hub',
  description: 'Your protected Drive Hub application workspace.'
})

interface ApplicationContextResponse {
  context: {
    isStudent: boolean
    isInstructor: boolean
    isManager: boolean
  }
}

const { user, logout, mutationStatus } = useAuth()
const { data: applicationContext } = await useFetch<ApplicationContextResponse>('/api/applications/context')

/** Ends the sealed session before returning to the public login page. */
async function signOut() {
  await logout()
  await navigateTo(authRoutes.login)
}
</script>

<template>
  <div class="dh-application-start">
    <section class="dh-application-start__hero">
      <div class="dh-application-start__container">
        <p>Application / Authenticated</p>
        <h1>Your lane is<br><span>ready.</span></h1>
        <div class="dh-application-start__identity">
          <div>
            <small>Signed in as</small>
            <strong>{{ user?.name }}</strong>
            <span>{{ user?.email }}</span>
          </div>
          <button type="button" :disabled="mutationStatus === 'pending'" @click="signOut">
            Sign out
          </button>
        </div>
      </div>
    </section>

    <section class="dh-application-start__body">
      <div class="dh-application-start__container dh-application-start__grid">
        <article>
          <span>01 / Select</span>
          <h2>Choose a school.</h2>
          <p>Compare schools and categories before beginning an application.</p>
          <NuxtLink to="/schools">Browse driving schools →</NuxtLink>
        </article>

        <article>
          <span>02 / Context</span>
          <h2>School relationship.</h2>
          <p v-if="applicationContext?.context.isStudent">Your student relationship is active. Lesson status and progress will appear here later.</p>
          <p v-else-if="applicationContext?.context.isInstructor">Your instructor relationship is active. Instructor tools will be added separately.</p>
          <p v-else-if="applicationContext?.context.isManager">Your manager relationship is active. School management will live in its dedicated area.</p>
          <p v-else>You are not connected to a school yet. This will happen after an application is accepted.</p>
        </article>

        <article>
          <span>03 / Next</span>
          <h2>Application workflow.</h2>
          <p>The submission form and application tracking will be implemented in the next feature without changing authentication.</p>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dh-application-start,
.dh-application-start * { box-sizing: border-box; }
.dh-application-start { min-height: 100vh; background: var(--dh-color-bg-page); }
.dh-application-start__container { width: 100%; max-width: 78rem; margin-inline: auto; }
.dh-application-start__hero { padding: 4.5rem 6rem 4rem; background: var(--dh-color-bg-inverse); color: var(--dh-color-text-inverse); }
.dh-application-start__hero p { margin: 0 0 1rem; color: var(--dh-color-bg-status); font-size: 0.75rem; font-weight: 700; letter-spacing: 0.075rem; text-transform: uppercase; }
.dh-application-start__hero h1 { margin: 0; font-family: 'Barlow Condensed', sans-serif; font-size: clamp(4.5rem, 8vw, 7rem); font-weight: 900; line-height: 0.82; text-transform: uppercase; }
.dh-application-start__hero h1 span { color: var(--dh-color-bg-accent); }
.dh-application-start__identity { display: flex; margin-top: 3rem; padding-top: 1.5rem; align-items: end; justify-content: space-between; gap: 2rem; border-top: 1px solid #424950; }
.dh-application-start__identity div { display: flex; flex-direction: column; gap: 0.25rem; }
.dh-application-start__identity small { color: #9fa7ad; font-size: 0.625rem; text-transform: uppercase; }
.dh-application-start__identity strong { font-size: 1.125rem; }
.dh-application-start__identity span { color: #c8ced4; font-size: 0.8125rem; }
.dh-application-start__identity button { min-height: 2.75rem; padding: 0 1rem; border: 1px solid #fff; background: transparent; color: #fff; font-weight: 700; text-transform: uppercase; cursor: pointer; }
.dh-application-start__body { padding: 5rem 6rem; }
.dh-application-start__grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border: 1px solid var(--dh-color-border-strong); }
.dh-application-start__grid article { display: flex; min-height: 21rem; padding: 2rem; flex-direction: column; border-right: 1px solid var(--dh-color-border-strong); background: var(--dh-color-bg-surface); }
.dh-application-start__grid article:last-child { border-right: 0; }
.dh-application-start__grid article > span { color: var(--dh-color-bg-accent); font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.05rem; text-transform: uppercase; }
.dh-application-start__grid h2 { margin: 2rem 0 1rem; font-family: 'Barlow Condensed', sans-serif; font-size: 2.25rem; line-height: 1; text-transform: uppercase; }
.dh-application-start__grid p { margin: 0; color: var(--dh-color-text-secondary); font-size: 0.875rem; line-height: 1.65; }
.dh-application-start__grid a { margin-top: auto; color: var(--dh-color-text-primary); font-size: 0.75rem; font-weight: 800; text-decoration: none; text-transform: uppercase; }

@media (max-width: 62rem) {
  .dh-application-start__hero,
  .dh-application-start__body { padding-inline: 2rem; }
  .dh-application-start__grid { grid-template-columns: 1fr; }
  .dh-application-start__grid article { min-height: 16rem; border-right: 0; border-bottom: 1px solid var(--dh-color-border-strong); }
  .dh-application-start__grid article:last-child { border-bottom: 0; }
}

@media (max-width: 34rem) {
  .dh-application-start__identity { align-items: flex-start; flex-direction: column; }
}
</style>
