<script lang="ts" setup>
import { authRoutes, userRoutes } from '#shared/constants/routes'
import { registerUserSchema } from '#shared/validation/auth'
import { authErrorMessage, authFieldErrors } from '~/utils/authPresentation'

definePageMeta({ layout: 'default', middleware: 'guest' })

useSeoMeta({
  title: 'Create account | Drive Hub',
  description: 'Create an ordinary Drive Hub user account and start your application.'
})

const account = reactive({ name: '', email: '', password: '', confirmPassword: '' })
const formError = ref('')
const fieldErrors = ref<Record<string, string>>({})
const { register, mutationStatus } = useAuth()

/** Role is intentionally absent: public registration always creates USER. */
async function submitRegistration() {
  formError.value = ''
  fieldErrors.value = {}

  const result = registerUserSchema.safeParse(account)
  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = String(issue.path[0])
      fieldErrors.value[field] ||= issue.message
    }
  }

  if (account.password !== account.confirmPassword) {
    fieldErrors.value.confirmPassword = 'Passwords do not match'
  }
  if (!result.success || Object.keys(fieldErrors.value).length) return

  try {
    await register(result.data)
    await navigateTo(userRoutes.startApplication)
  } catch (error) {
    formError.value = authErrorMessage(error, 'Unable to create the account. Please try again.')
    fieldErrors.value = authFieldErrors(error)
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
    <form class="dh-auth-form" novalidate @submit.prevent="submitRegistration">
      <header class="dh-auth-form__heading">
        <span>Ordinary user account</span>
        <h2>Register</h2>
      </header>

      <label>
        Full name
        <input v-model.trim="account.name" type="text" autocomplete="name" minlength="2" maxlength="80" required autofocus :aria-invalid="!!fieldErrors.name" :aria-describedby="fieldErrors.name ? 'register-name-error' : undefined">
        <span v-if="fieldErrors.name" id="register-name-error" class="dh-auth-form__field-error" role="alert">{{ fieldErrors.name }}</span>
      </label>

      <label>
        Email
        <input v-model.trim="account.email" type="email" autocomplete="email" required :aria-invalid="!!fieldErrors.email" :aria-describedby="fieldErrors.email ? 'register-email-error' : undefined">
        <span v-if="fieldErrors.email" id="register-email-error" class="dh-auth-form__field-error" role="alert">{{ fieldErrors.email }}</span>
      </label>

      <label>
        Password
        <input v-model="account.password" type="password" autocomplete="new-password" minlength="8" maxlength="128" required :aria-invalid="!!fieldErrors.password" :aria-describedby="fieldErrors.password ? 'register-password-hint register-password-error' : 'register-password-hint'">
        <span id="register-password-hint" class="dh-auth-form__hint">Use 8–128 characters, including a letter and a number.</span>
        <span v-if="fieldErrors.password" id="register-password-error" class="dh-auth-form__field-error" role="alert">{{ fieldErrors.password }}</span>
      </label>

      <label>
        Confirm password
        <input v-model="account.confirmPassword" type="password" autocomplete="new-password" minlength="8" maxlength="128" required :aria-invalid="!!fieldErrors.confirmPassword" :aria-describedby="fieldErrors.confirmPassword ? 'register-confirm-error' : undefined">
        <span v-if="fieldErrors.confirmPassword" id="register-confirm-error" class="dh-auth-form__field-error" role="alert">{{ fieldErrors.confirmPassword }}</span>
      </label>

      <p v-if="formError" class="dh-auth-form__error" role="alert">{{ formError }}</p>

      <button type="submit" :disabled="mutationStatus === 'pending'">
        {{ mutationStatus === 'pending' ? 'Creating account…' : 'Create account →' }}
      </button>
    </form>
  </AuthShell>
</template>
