<script lang="ts" setup>
import { adminRoutes, authRoutes, userRoutes } from '#shared/constants/routes'
import { authErrorMessage, safeRedirect } from '~/utils/authPresentation'

definePageMeta({ layout: 'default', middleware: 'guest' })

useSeoMeta({
  title: 'Sign in | Drive Hub',
  description: 'Sign in to your Drive Hub account.'
})

const route = useRoute()
const credentials = reactive({ email: '', password: '' })
const formError = ref('')
const { login, mutationStatus } = useAuth()
const isDevelopment = import.meta.dev
const developmentAccounts = [
  { label: 'Student', email: 'student@drivehub.test' },
  { label: 'Admin', email: 'admin@drivehub.test' },
  { label: 'Manager', email: 'manager@drivehub.test' },
  { label: 'Instructor', email: 'instructor@drivehub.test' },
  { label: 'Applicant', email: 'applicant@drivehub.test' }
]

function fillDevelopmentAccount(email: string) {
  credentials.email = email
  credentials.password = 'DriveHub123!'
  formError.value = ''
}

/** Submits credentials, refreshes the cookie session, then uses a safe redirect. */
async function submitLogin() {
  formError.value = ''

  try {
    const { user } = await login(credentials)
    await navigateTo(user.role === 'ADMIN'
      ? adminRoutes.dashboard
      : safeRedirect(route.query.redirect, userRoutes.startApplication))
  } catch (error) {
    formError.value = authErrorMessage(error, 'Unable to sign in. Please try again.')
  }
}
</script>

<template>
  <AuthShell
    eyebrow="Account / Welcome back"
    title="Return to your line."
    description="Sign in to access your Drive Hub account."
    alternative-label="New to Drive Hub?"
    :alternative-to="authRoutes.register"
  >
    <form class="dh-auth-form" @submit.prevent="submitLogin">
      <header class="dh-auth-form__heading">
        <span>Account access</span>
        <h2>Sign in</h2>
      </header>

      <fieldset v-if="isDevelopment" class="dh-login-accounts" :disabled="mutationStatus === 'pending'">
        <legend>Quick fill · Development accounts</legend>
        <div class="dh-login-accounts__buttons">
          <button v-for="account in developmentAccounts" :key="account.email" type="button"
            :aria-pressed="credentials.email === account.email"
            @click="fillDevelopmentAccount(account.email)">
            {{ account.label }}
          </button>
        </div>
      </fieldset>

      <label>
        Email
        <input v-model.trim="credentials.email" type="email" autocomplete="email" required autofocus>
      </label>

      <label>
        Password
        <input v-model="credentials.password" type="password" autocomplete="current-password" required>
      </label>

      <p v-if="formError" class="dh-auth-form__error" role="alert">{{ formError }}</p>

      <button type="submit" :disabled="mutationStatus === 'pending'">
        {{ mutationStatus === 'pending' ? 'Signing in…' : 'Sign in →' }}
      </button>
    </form>
  </AuthShell>
</template>

<style scoped>
.dh-login-accounts {
  min-width: 0;
  margin: 0;
  padding: 1rem;
  border: 1px solid var(--dh-color-border-default, #c8ced4);
}

.dh-login-accounts legend {
  padding-inline: 0.375rem;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04rem;
  text-transform: uppercase;
}

.dh-login-accounts__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.dh-login-accounts__buttons button {
  min-height: 2.5rem;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--dh-color-border-strong, #080a0d);
  background: var(--dh-color-bg-surface, #ffffff);
  color: var(--dh-color-text-primary, #080a0d);
  font: inherit;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.dh-login-accounts__buttons button:hover,
.dh-login-accounts__buttons button[aria-pressed='true'] {
  background: var(--dh-color-bg-status, #c9f24d);
}

.dh-login-accounts__buttons button:focus-visible {
  outline: 2px solid var(--dh-color-text-primary, #080a0d);
  outline-offset: 3px;
}

.dh-login-accounts:disabled button {
  opacity: 0.6;
  cursor: wait;
}
</style>
