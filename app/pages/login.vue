<script lang="ts" setup>
import { authRoutes, userRoutes } from '#shared/constants/routes'
import { authErrorMessage, safeRedirect } from '~/utils/authPresentation'

definePageMeta({ layout: 'default', middleware: 'guest' })

useSeoMeta({
  title: 'Sign in | Drive Hub',
  description: 'Sign in to continue your Drive Hub application.'
})

const route = useRoute()
const credentials = reactive({ email: '', password: '' })
const formError = ref('')
const { login, mutationStatus } = useAuth()

/** Submits credentials, refreshes the cookie session, then uses a safe redirect. */
async function submitLogin() {
  formError.value = ''

  try {
    await login(credentials)
    await navigateTo(safeRedirect(route.query.redirect, userRoutes.startApplication))
  } catch (error) {
    formError.value = authErrorMessage(error, 'Unable to sign in. Please try again.')
  }
}
</script>

<template>
  <AuthShell
    eyebrow="Account / Welcome back"
    title="Return to your line."
    description="Continue your application and keep every next step in one secure place."
    alternative-label="New to Drive Hub?"
    :alternative-to="authRoutes.register"
  >
    <form class="dh-auth-form" @submit.prevent="submitLogin">
      <header class="dh-auth-form__heading">
        <span>User access</span>
        <h2>Sign in</h2>
      </header>

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
