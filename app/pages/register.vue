<script lang="ts" setup>
import { authRoutes, userRoutes } from '#shared/constants/routes'
import { authErrorMessage } from '~/utils/authPresentation'

definePageMeta({ layout: 'default', middleware: 'guest' })

useSeoMeta({
  title: 'Create account | Drive Hub',
  description: 'Create an ordinary Drive Hub user account and start your application.'
})

const account = reactive({ name: '', email: '', password: '', confirmPassword: '' })
const formError = ref('')
const { register, mutationStatus } = useAuth()

/** Role is intentionally absent: public registration always creates USER. */
async function submitRegistration() {
  formError.value = ''

  if (account.password !== account.confirmPassword) {
    formError.value = 'Passwords do not match'
    return
  }

  try {
    await register({
      name: account.name,
      email: account.email,
      password: account.password
    })
    await navigateTo(userRoutes.startApplication)
  } catch (error) {
    formError.value = authErrorMessage(error, 'Unable to create the account. Please try again.')
  }
}
</script>

<template>
  <AuthShell
    eyebrow="Account / New driver"
    title="Take the first move."
    description="Create your account to apply to a school and, later, follow lessons and licence progress."
    alternative-label="Already registered?"
    :alternative-to="authRoutes.login"
  >
    <form class="dh-auth-form" @submit.prevent="submitRegistration">
      <header class="dh-auth-form__heading">
        <span>Ordinary user account</span>
        <h2>Register</h2>
      </header>

      <label>
        Full name
        <input v-model.trim="account.name" type="text" autocomplete="name" minlength="2" maxlength="80" required autofocus>
      </label>

      <label>
        Email
        <input v-model.trim="account.email" type="email" autocomplete="email" required>
      </label>

      <label>
        Password
        <input v-model="account.password" type="password" autocomplete="new-password" minlength="8" maxlength="128" required>
      </label>

      <label>
        Confirm password
        <input v-model="account.confirmPassword" type="password" autocomplete="new-password" minlength="8" maxlength="128" required>
      </label>

      <p v-if="formError" class="dh-auth-form__error" role="alert">{{ formError }}</p>

      <button type="submit" :disabled="mutationStatus === 'pending'">
        {{ mutationStatus === 'pending' ? 'Creating account…' : 'Create account →' }}
      </button>
    </form>
  </AuthShell>
</template>
