<script lang="ts" setup>
import { authErrorMessage } from '~/utils/authPresentation'

definePageMeta({ layout: 'default', middleware: 'auth' })
useSeoMeta({ title: 'Account settings | Drive Hub' })

const session = useUserSession()
const { data, error, refresh } = await useFetch('/api/account/profile')
const profile = reactive({ name: '', email: '', currentPassword: '' })
const passwords = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })
const saving = ref<'profile' | 'password' | null>(null)
const profileError = ref('')
const profileSuccess = ref('')
const passwordError = ref('')
const passwordSuccess = ref('')
const changingEmail = computed(() => profile.email.trim().toLowerCase() !== data.value?.user.email)

function clearFeedback() {
  profileError.value = ''
  profileSuccess.value = ''
  passwordError.value = ''
  passwordSuccess.value = ''
}

watch(data, (value) => {
  if (!value) return
  profile.name = value.user.name
  profile.email = value.user.email
}, { immediate: true })

async function saveProfile() {
  clearFeedback()
  saving.value = 'profile'
  try {
    data.value = await $fetch('/api/account/profile', {
      method: 'PATCH',
      body: {
        name: profile.name,
        email: profile.email,
        currentPassword: changingEmail.value ? profile.currentPassword : undefined
      }
    })
    profile.currentPassword = ''
    await session.fetch()
    profileSuccess.value = 'Your account details have been saved.'
  } catch (error) {
    profileError.value = authErrorMessage(error, 'Unable to save your account details.')
  } finally {
    saving.value = null
  }
}

async function savePassword() {
  clearFeedback()
  if (passwords.newPassword !== passwords.confirmPassword) {
    passwordError.value = 'New passwords do not match.'
    return
  }
  saving.value = 'password'
  try {
    await $fetch('/api/account/password', {
      method: 'PATCH',
      body: { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword }
    })
    passwords.currentPassword = ''
    passwords.newPassword = ''
    passwords.confirmPassword = ''
    await session.fetch()
    passwordSuccess.value = 'Your password has been changed.'
  } catch (error) {
    passwordError.value = authErrorMessage(error, 'Unable to change your password.')
  } finally {
    saving.value = null
  }
}
</script>

<template>
  <div class="dh-profile">
    <AppToast
      :message="profileError || passwordError || profileSuccess || passwordSuccess"
      :tone="profileError || passwordError ? 'error' : 'success'"
      @close="clearFeedback"
    />
    <header class="dh-profile__hero">
      <div class="dh-profile__container">
        <p class="dh-profile__eyebrow">Your account</p>
        <h1>Account settings</h1>
        <p>Keep your details up to date and manage your password.</p>
      </div>
    </header>

    <div class="dh-profile__container dh-profile__body">
      <div v-if="error" class="dh-profile__panel">
        <p role="alert">Your account settings could not be loaded.</p>
        <button type="button" @click="refresh()">Try again</button>
      </div>
      <div v-else-if="data" class="dh-profile__grid">
        <form class="dh-profile__panel" @submit.prevent="saveProfile">
          <h2>Personal details</h2>
          <p>Your name appears in your account and school records.</p>
          <fieldset :disabled="saving !== null">
            <legend class="dh-profile__sr-only">Personal details</legend>
            <label>
              Full name
              <input v-model="profile.name" autocomplete="name" required minlength="2" maxlength="80">
            </label>
            <label>
              Email address
              <input v-model.trim="profile.email" type="email" autocomplete="email" required>
            </label>
            <label v-if="changingEmail">
              Current password
              <input v-model="profile.currentPassword" type="password" autocomplete="current-password" required maxlength="128"
                aria-describedby="email-password-help">
              <small id="email-password-help">Confirm your current password to change your sign-in email.</small>
            </label>
            <button type="submit">{{ saving === 'profile' ? 'Saving…' : 'Save details' }}</button>
          </fieldset>
        </form>

        <form class="dh-profile__panel" @submit.prevent="savePassword">
          <h2>Change password</h2>
          <p>Choose a password you don’t use for other accounts.</p>
          <fieldset :disabled="saving !== null">
            <legend class="dh-profile__sr-only">Change password</legend>
            <input class="dh-profile__sr-only" :value="data.user.email" autocomplete="username" readonly tabindex="-1" aria-label="Sign-in email">
            <label>
              Current password
              <input v-model="passwords.currentPassword" type="password" autocomplete="current-password" required maxlength="128">
            </label>
            <label>
              New password
              <input v-model="passwords.newPassword" type="password" autocomplete="new-password" required minlength="8" maxlength="128"
                pattern="(?=.*[A-Za-z])(?=.*[0-9]).{8,128}" aria-describedby="new-password-help">
              <small id="new-password-help">Use 8–128 characters, including a letter and a number.</small>
            </label>
            <label>
              Confirm new password
              <input v-model="passwords.confirmPassword" type="password" autocomplete="new-password" required minlength="8" maxlength="128">
            </label>
            <button type="submit">{{ saving === 'password' ? 'Changing…' : 'Change password' }}</button>
          </fieldset>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dh-profile { background: var(--dh-color-bg-page); }
.dh-profile__container { width: min(100%, 78rem); margin-inline: auto; }
.dh-profile__hero { padding: 4rem 6rem; background: var(--dh-color-bg-inverse); color: white; }
.dh-profile__eyebrow { color: var(--dh-color-bg-status); font-size: 0.75rem; font-weight: 700; letter-spacing: 0.075rem; text-transform: uppercase; }
.dh-profile h1 { margin: 1rem 0; font-family: 'Barlow Condensed', sans-serif; font-size: clamp(3rem, 6vw, 5rem); line-height: 1; text-transform: uppercase; }
.dh-profile__hero p:last-child { margin: 0; color: #c8ced4; line-height: 1.6; }
.dh-profile__body { padding: 3rem 6rem 5rem; }
.dh-profile__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; gap: 2rem; }
.dh-profile__panel { min-width: 0; padding: 2rem; border: 1px solid var(--dh-color-border-default); background: white; }
.dh-profile h2 { margin: 0 0 0.75rem; font-family: 'Barlow Condensed', sans-serif; font-size: 2rem; text-transform: uppercase; }
.dh-profile__panel > p { margin: 0 0 1.75rem; color: var(--dh-color-text-secondary); font-size: 0.875rem; line-height: 1.6; }
.dh-profile fieldset { display: flex; min-width: 0; margin: 0; padding: 0; flex-direction: column; gap: 1.25rem; border: 0; }
.dh-profile label { display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.8125rem; font-weight: 600; }
.dh-profile input { width: 100%; min-height: 3rem; padding: 0.75rem; border: 1px solid var(--dh-color-border-strong); border-radius: 0; background: white; }
.dh-profile small { color: var(--dh-color-text-secondary); font-size: 0.75rem; font-weight: 400; line-height: 1.5; }
.dh-profile button { min-height: 3rem; padding: 0.75rem 1.25rem; border: 1px solid var(--dh-color-border-strong); background: var(--dh-color-bg-status); color: var(--dh-color-text-primary); font-weight: 600; cursor: pointer; }
.dh-profile button:hover { background: #b6df3d; }
.dh-profile fieldset:disabled { opacity: 0.65; }
.dh-profile fieldset:disabled button { cursor: wait; }
.dh-profile input:focus-visible, .dh-profile button:focus-visible { outline: 2px solid var(--dh-color-text-primary); outline-offset: 3px; }
.dh-profile__sr-only { position: absolute; width: 1px !important; height: 1px; min-height: 0 !important; padding: 0 !important; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0 !important; }
@media (max-width: 70rem) { .dh-profile__hero, .dh-profile__body { padding-inline: 2rem; } }
@media (max-width: 52rem) { .dh-profile__grid { grid-template-columns: 1fr; } }
@media (max-width: 34rem) { .dh-profile__hero, .dh-profile__body { padding-inline: 1.25rem; } .dh-profile__panel { padding: 1.25rem; } }
</style>
