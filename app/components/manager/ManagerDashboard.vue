<script setup lang="ts">
import type {
  DashboardResponse,
  ManagerApplication,
  ManagerLessonItem,
  ManagerStudent,
  ManagerVehicle,
  TrainingStatus
} from '~/types/dashboard'

type ManagerDashboardData = Extract<DashboardResponse, { view: 'MANAGER' }>
type Candidate = { id: number; name: string; email: string }
type StudentTraining = ManagerStudent['trainingAsStudent'][number]
type TrainingDraft = { status: TrainingStatus; instructorId: number | null; vehicleId: number | null }

const props = defineProps<{ dashboard: ManagerDashboardData }>()
const emit = defineEmits<{ refresh: [] }>()

const approvalInstructor = reactive<Record<number, number | null>>({})
const busyKey = ref('')
const actionError = ref('')
const actionMessage = ref('')
const searchEmail = ref('')
const candidates = ref<Candidate[]>([])
const searchPending = ref(false)
const lessonSearch = ref('')
const lessonStudentFilter = ref('all')
const lessonInstructorFilter = ref('all')
const lessonCategoryFilter = ref('all')
const lessonStatusFilter = ref('all')
const rescheduleLessonId = ref<number | null>(null)
const editingVehicleId = ref<number | null>(null)
const currentTime = ref(Date.now())
const trainingDrafts = reactive<Record<number, TrainingDraft>>({})
let searchTimer: ReturnType<typeof setTimeout> | undefined
let completionClock: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  completionClock = setInterval(() => {
    currentTime.value = Date.now()
  }, 30_000)
})

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
  if (completionClock) clearInterval(completionClock)
})

const scheduleForm = reactive({
  trainingEnrollmentId: null as number | null,
  curriculumLessonId: null as number | null,
  scheduledStart: '',
  includesInstructor: true,
  instructorId: null as number | null,
  vehicleId: null as number | null,
  notes: ''
})
const rescheduleForm = reactive({
  scheduledStart: '',
  includesInstructor: true,
  instructorId: null as number | null,
  vehicleId: null as number | null
})
const vehicleForm = reactive({
  registration: '',
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  instructorId: null as number | null
})

watch(() => props.dashboard.students, (students) => {
  const currentTrainingIds = new Set<number>()
  for (const student of students) {
    for (const training of student.trainingAsStudent) {
      currentTrainingIds.add(training.id)
      trainingDrafts[training.id] = {
        status: training.status,
        instructorId: training.instructor?.id ?? null,
        vehicleId: training.vehicle?.id ?? null
      }
    }
  }
  for (const trainingId of Object.keys(trainingDrafts).map(Number)) {
    if (!currentTrainingIds.has(trainingId)) delete trainingDrafts[trainingId]
  }
}, { immediate: true, deep: true })

const pendingApplications = computed(() =>
  props.dashboard.applications.filter((application) => application.status === 'PENDING')
)
const decidedApplications = computed(() =>
  props.dashboard.applications.filter((application) => application.status !== 'PENDING').slice(0, 8)
)
const activeTrainings = computed(() =>
  props.dashboard.trainings.filter((training) => training.status === 'ACTIVE')
)
const selectedTraining = computed(() =>
  activeTrainings.value.find((training) => training.id === scheduleForm.trainingEnrollmentId) ?? null
)
const selectedLesson = computed(() =>
  selectedTraining.value?.category.lessons.find((lesson) => lesson.id === scheduleForm.curriculumLessonId) ?? null
)
const availableVehicles = computed(() =>
  props.dashboard.vehicles.filter((vehicle) =>
    !scheduleForm.includesInstructor || !scheduleForm.instructorId ||
    vehicle.instructorId === null || vehicle.instructorId === scheduleForm.instructorId
  )
)
const lessonCategories = computed(() => {
  const categories = new Map<number, { id: number; code: string | null; name: string }>()
  for (const lesson of props.dashboard.lessons) categories.set(lesson.category.id, lesson.category)
  return [...categories.values()].sort((left, right) => left.name.localeCompare(right.name))
})
const visibleLessons = computed(() => {
  const search = lessonSearch.value.trim().toLowerCase()
  return props.dashboard.lessons.filter((session) => {
    const matchesSearch = !search || [
      session.student.name,
      session.student.email,
      session.instructor?.name ?? 'no instructor',
      session.category.code ?? '',
      session.category.name,
      session.lesson.title
    ].some((value) => value.toLowerCase().includes(search))
    const matchesStudent = lessonStudentFilter.value === 'all' || session.student.id === Number(lessonStudentFilter.value)
    const matchesInstructor = lessonInstructorFilter.value === 'all'
      || (lessonInstructorFilter.value === 'none' ? session.instructor === null : session.instructor?.id === Number(lessonInstructorFilter.value))
    const matchesCategory = lessonCategoryFilter.value === 'all' || session.category.id === Number(lessonCategoryFilter.value)
    const matchesStatus = lessonStatusFilter.value === 'all' || session.status === lessonStatusFilter.value
    return matchesSearch && matchesStudent && matchesInstructor && matchesCategory && matchesStatus
  })
})
const selectedRescheduleLesson = computed(() =>
  props.dashboard.lessons.find((lesson) => lesson.id === rescheduleLessonId.value) ?? null
)
const rescheduleVehicles = computed(() =>
  props.dashboard.vehicles.filter((vehicle) =>
    !rescheduleForm.includesInstructor || !rescheduleForm.instructorId ||
    vehicle.instructorId === null || vehicle.instructorId === rescheduleForm.instructorId
  )
)

function trainingDraft(training: StudentTraining) {
  return trainingDrafts[training.id] ?? {
    status: training.status,
    instructorId: training.instructor?.id ?? null,
    vehicleId: training.vehicle?.id ?? null
  }
}

function trainingVehicles(training: StudentTraining) {
  const instructorId = trainingDraft(training).instructorId
  return props.dashboard.vehicles.filter(vehicle =>
    vehicle.instructorId === null || vehicle.instructorId === instructorId
  )
}

function trainingInstructorChanged(training: StudentTraining) {
  const draft = trainingDraft(training)
  if (draft.vehicleId && !trainingVehicles(training).some(vehicle => vehicle.id === draft.vehicleId)) {
    draft.vehicleId = null
  }
}

function setTrainingStatus(training: StudentTraining, value: string) {
  trainingDraft(training).status = value as TrainingStatus
}

function setTrainingInstructor(training: StudentTraining, value: string) {
  trainingDraft(training).instructorId = Number(value) || null
  trainingInstructorChanged(training)
}

function setTrainingVehicle(training: StudentTraining, value: string) {
  trainingDraft(training).vehicleId = Number(value) || null
}

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Skopje'
})

function getError(error: unknown) {
  return (error as any)?.data?.statusMessage
    ?? (error as any)?.data?.message
    ?? (error as Error)?.message
    ?? 'The action could not be completed.'
}

async function runAction(key: string, success: string, operation: () => Promise<unknown>) {
  busyKey.value = key
  actionError.value = ''
  actionMessage.value = ''
  try {
    await operation()
    actionMessage.value = success
    emit('refresh')
  } catch (error) {
    actionError.value = getError(error)
  } finally {
    busyKey.value = ''
  }
}

function selectedApprovalInstructor(application: ManagerApplication) {
  if (!(application.id in approvalInstructor)) {
    approvalInstructor[application.id] = application.preferredInstructorId
      ?? props.dashboard.instructors[0]?.id
      ?? null
  }
  return approvalInstructor[application.id]
}

function approve(application: ManagerApplication) {
  const instructorId = selectedApprovalInstructor(application)
  if (!instructorId) {
    actionError.value = 'Add an instructor before approving this application.'
    return
  }
  return runAction(`approve-${application.id}`, `${application.user.name} is now enrolled.`, () =>
    $fetch(`/api/manager/applications/${application.id}/approve`, {
      method: 'POST', body: { instructorId }
    })
  )
}

function reject(application: ManagerApplication) {
  if (!window.confirm(`Reject ${application.user.name}’s application?`)) return
  return runAction(`reject-${application.id}`, `${application.user.name}’s application was rejected.`, () =>
    $fetch(`/api/manager/applications/${application.id}/reject`, { method: 'POST' })
  )
}

watch(searchEmail, (value) => {
  if (searchTimer) clearTimeout(searchTimer)
  candidates.value = []
  if (value.trim().length < 2) {
    searchPending.value = false
    return
  }
  searchPending.value = true
  searchTimer = setTimeout(async () => {
    try {
      candidates.value = await $fetch<Candidate[]>('/api/manager/candidates', {
        query: { q: value.trim() }
      })
    } catch (error) {
      actionError.value = getError(error)
    } finally {
      searchPending.value = false
    }
  }, 250)
})

async function addInstructor(candidate: Candidate) {
  await runAction(`add-${candidate.id}`, `${candidate.name} was added as an instructor.`, () =>
    $fetch('/api/manager/instructors', { method: 'POST', body: { userId: candidate.id } })
  )
  if (!actionError.value) {
    candidates.value = candidates.value.filter((item) => item.id !== candidate.id)
    searchEmail.value = ''
  }
}

function removeInstructor(instructorId: number, name: string) {
  if (!window.confirm(`Remove ${name} from this school? Their students and vehicles will become unassigned, and their scheduled lessons will be cancelled.`)) return
  return runAction(`remove-${instructorId}`, `${name} was removed from the instructor roster.`, () =>
    $fetch(`/api/manager/instructors/${instructorId}`, { method: 'DELETE' })
  )
}

function saveTraining(training: StudentTraining, studentName: string) {
  const draft = trainingDraft(training)
  return runAction(`training-${training.id}`, `${studentName}’s programme was updated.`, () =>
    $fetch(`/api/manager/trainings/${training.id}`, {
      method: 'PATCH',
      body: {
        status: draft.status,
        instructorId: draft.instructorId,
        vehicleId: draft.vehicleId
      }
    })
  )
}

function removeStudent(student: ManagerStudent) {
  if (!window.confirm(`Remove ${student.name} from this school? Active programmes and scheduled lessons will be cancelled, but completed lesson history will be kept.`)) return
  return runAction(`student-${student.id}`, `${student.name} was removed from the school.`, () =>
    $fetch(`/api/manager/students/${student.id}`, { method: 'DELETE' })
  )
}

function resetVehicleForm() {
  editingVehicleId.value = null
  vehicleForm.registration = ''
  vehicleForm.brand = ''
  vehicleForm.model = ''
  vehicleForm.year = new Date().getFullYear()
  vehicleForm.instructorId = null
}

function editVehicle(vehicle: ManagerVehicle) {
  editingVehicleId.value = vehicle.id
  vehicleForm.registration = vehicle.registration
  vehicleForm.brand = vehicle.brand
  vehicleForm.model = vehicle.model
  vehicleForm.year = vehicle.year
  vehicleForm.instructorId = vehicle.instructorId
}

async function saveVehicle() {
  const vehicleId = editingVehicleId.value
  await runAction(
    vehicleId ? `vehicle-${vehicleId}` : 'vehicle-new',
    vehicleId ? 'Vehicle updated.' : 'Vehicle added to the fleet.',
    () => $fetch(vehicleId ? `/api/manager/vehicles/${vehicleId}` : '/api/manager/vehicles', {
      method: vehicleId ? 'PATCH' : 'POST',
      body: {
        registration: vehicleForm.registration,
        brand: vehicleForm.brand,
        model: vehicleForm.model,
        year: vehicleForm.year,
        instructorId: vehicleForm.instructorId
      }
    })
  )
  if (!actionError.value) resetVehicleForm()
}

function removeVehicle(vehicle: ManagerVehicle) {
  if (!window.confirm(`Remove ${vehicle.registration} from the fleet? It will be unassigned from students and lesson records.`)) return
  return runAction(`vehicle-remove-${vehicle.id}`, `${vehicle.registration} was removed.`, () =>
    $fetch(`/api/manager/vehicles/${vehicle.id}`, { method: 'DELETE' })
  )
}

watch(() => scheduleForm.trainingEnrollmentId, () => {
  scheduleForm.curriculumLessonId = selectedTraining.value?.category.lessons[0]?.id ?? null
  scheduleForm.instructorId = selectedTraining.value?.instructor?.id
    ?? props.dashboard.instructors[0]?.id
    ?? null
  scheduleForm.vehicleId = selectedTraining.value?.vehicle?.id ?? null
})

watch(() => scheduleForm.curriculumLessonId, () => {
  if (selectedLesson.value?.type === 'PRACTICAL') scheduleForm.includesInstructor = true
})

watch(() => scheduleForm.includesInstructor, (included) => {
  if (!included) {
    scheduleForm.instructorId = null
    scheduleForm.vehicleId = null
  } else if (!scheduleForm.instructorId) {
    scheduleForm.instructorId = selectedTraining.value?.instructor?.id
      ?? props.dashboard.instructors[0]?.id
      ?? null
  }
})

async function scheduleLesson() {
  if (!scheduleForm.trainingEnrollmentId || !scheduleForm.curriculumLessonId || !scheduleForm.scheduledStart) {
    actionError.value = 'Choose a student, lesson and start time.'
    return
  }
  if (scheduleForm.includesInstructor && !scheduleForm.instructorId) {
    actionError.value = 'Choose an instructor for this lesson.'
    return
  }
  await runAction('schedule', 'Lesson scheduled successfully.', () =>
    $fetch('/api/manager/lessons', {
      method: 'POST',
      body: {
        trainingEnrollmentId: scheduleForm.trainingEnrollmentId,
        curriculumLessonId: scheduleForm.curriculumLessonId,
        scheduledStart: new Date(scheduleForm.scheduledStart).toISOString(),
        instructorId: scheduleForm.includesInstructor ? scheduleForm.instructorId : null,
        vehicleId: scheduleForm.includesInstructor ? scheduleForm.vehicleId : null,
        notes: scheduleForm.notes.trim() || null
      }
    })
  )
  if (!actionError.value) {
    scheduleForm.scheduledStart = ''
    scheduleForm.notes = ''
  }
}

function canComplete(session: ManagerLessonItem) {
  return session.status === 'SCHEDULED' && new Date(session.scheduledStart).getTime() <= currentTime.value
}

function completeLesson(session: ManagerLessonItem) {
  return runAction(`complete-${session.id}`, 'Lesson marked as completed.', () =>
    $fetch(`/api/manager/lessons/${session.id}`, {
      method: 'PATCH', body: { action: 'complete' }
    })
  )
}

function cancelLesson(session: ManagerLessonItem) {
  if (!window.confirm(`Cancel ${session.student.name}’s ${session.lesson.title} lesson?`)) return
  return runAction(`cancel-${session.id}`, 'Lesson cancelled.', () =>
    $fetch(`/api/manager/lessons/${session.id}`, {
      method: 'PATCH', body: { action: 'cancel' }
    })
  )
}

function toLocalDateTime(value: string) {
  const date = new Date(value)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

function startReschedule(session: ManagerLessonItem) {
  rescheduleLessonId.value = session.id
  rescheduleForm.scheduledStart = toLocalDateTime(session.scheduledStart)
  rescheduleForm.includesInstructor = session.instructor !== null || session.lesson.type === 'PRACTICAL'
  rescheduleForm.instructorId = session.instructor?.id ?? null
  rescheduleForm.vehicleId = session.vehicle?.id ?? null
}

function cancelReschedule() {
  rescheduleLessonId.value = null
}

watch(() => rescheduleForm.includesInstructor, (included) => {
  if (!included) {
    rescheduleForm.instructorId = null
    rescheduleForm.vehicleId = null
  }
})

async function submitReschedule(session: ManagerLessonItem) {
  if (!rescheduleForm.scheduledStart) {
    actionError.value = 'Choose a new lesson time.'
    return
  }
  if (rescheduleForm.includesInstructor && !rescheduleForm.instructorId) {
    actionError.value = 'Choose an instructor for this lesson.'
    return
  }
  await runAction(`reschedule-${session.id}`, 'Lesson rescheduled.', () =>
    $fetch(`/api/manager/lessons/${session.id}`, {
      method: 'PATCH',
      body: {
        action: 'reschedule',
        scheduledStart: new Date(rescheduleForm.scheduledStart).toISOString(),
        instructorId: rescheduleForm.includesInstructor ? rescheduleForm.instructorId : null,
        vehicleId: rescheduleForm.includesInstructor ? rescheduleForm.vehicleId : null
      }
    })
  )
  if (!actionError.value) rescheduleLessonId.value = null
}
</script>

<template>
  <div class="dh-manager">
    <section class="dh-manager__summary" aria-label="School summary">
      <article><span>Pending applications</span><strong>{{ dashboard.summary.pendingApplications }}</strong><small>Waiting for review</small></article>
      <article><span>Instructors</span><strong>{{ dashboard.summary.instructors }}</strong><small>On the school roster</small></article>
      <article><span>Active students</span><strong>{{ dashboard.summary.activeStudents }}</strong><small>In current training</small></article>
      <article><span>Vehicles</span><strong>{{ dashboard.summary.vehicles }}</strong><small>In the school fleet</small></article>
    </section>

    <div v-if="actionError || actionMessage" class="dh-manager__notice" :class="{ 'is-error': actionError }" role="status">
      {{ actionError || actionMessage }}
    </div>

    <section class="dh-manager__section" aria-labelledby="manager-applications-title">
      <header class="dh-manager__heading">
        <div><p>Admissions</p><h2 id="manager-applications-title">Application queue</h2></div>
        <span>{{ pendingApplications.length }} pending</span>
      </header>
      <div v-if="pendingApplications.length" class="dh-manager__applications">
        <article v-for="application in pendingApplications" :key="application.id">
          <div class="dh-manager__applicant">
            <span>{{ application.user.name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase() }}</span>
            <div><h3>{{ application.user.name }}</h3><a :href="`mailto:${application.user.email}`">{{ application.user.email }}</a></div>
          </div>
          <dl>
            <div><dt>Programme</dt><dd>{{ application.category.code || '—' }} · {{ application.category.name }}</dd></div>
            <div><dt>Applied</dt><dd>{{ new Date(application.startedAt).toLocaleDateString('en-GB') }}</dd></div>
            <div><dt>Requested</dt><dd>{{ application.preferredInstructor?.name || 'No preference' }}</dd></div>
          </dl>
          <label>
            Assign instructor
            <select :value="selectedApprovalInstructor(application)" @change="approvalInstructor[application.id] = Number(($event.target as HTMLSelectElement).value) || null">
              <option :value="null">Choose instructor</option>
              <option v-for="instructor in dashboard.instructors" :key="instructor.id" :value="instructor.id" :disabled="instructor.activeStudents >= 3">
                {{ instructor.name }} · {{ instructor.activeStudents }}/3 students
              </option>
            </select>
          </label>
          <div class="dh-manager__actions">
            <button type="button" class="is-primary" :disabled="!!busyKey || !dashboard.instructors.length" @click="approve(application)">
              {{ busyKey === `approve-${application.id}` ? 'Approving…' : 'Approve & assign' }}
            </button>
            <button type="button" :disabled="!!busyKey" @click="reject(application)">Reject</button>
          </div>
        </article>
      </div>
      <div v-else class="dh-manager__empty">No applications are waiting for review.</div>

      <details v-if="decidedApplications.length" class="dh-manager__history">
        <summary>Recent decisions ({{ decidedApplications.length }})</summary>
        <div><p v-for="application in decidedApplications" :key="application.id"><strong>{{ application.user.name }}</strong><span>{{ application.category.code || application.category.name }}</span><em :class="`is-${application.status.toLowerCase()}`">{{ application.status.toLowerCase() }}</em></p></div>
      </details>
    </section>

    <section class="dh-manager__section" aria-labelledby="manager-students-title">
      <header class="dh-manager__heading">
        <div><p>Students</p><h2 id="manager-students-title">School roster</h2></div>
        <span>{{ dashboard.students.length }} students</span>
      </header>
      <div v-if="dashboard.students.length" class="dh-manager__students">
        <article v-for="student in dashboard.students" :key="student.id">
          <header class="dh-manager__student-header">
            <div class="dh-manager__student-identity">
              <strong>{{ student.name }}</strong>
              <a :href="`mailto:${student.email}`">{{ student.email }}</a>
            </div>
            <button type="button" class="is-danger" :disabled="!!busyKey" @click="removeStudent(student)">
              {{ busyKey === `student-${student.id}` ? 'Removing…' : 'Remove student' }}
            </button>
          </header>
          <div v-if="student.trainingAsStudent.length" class="dh-manager__student-trainings">
            <form v-for="training in student.trainingAsStudent" :key="training.id" @submit.prevent="saveTraining(training, student.name)">
              <strong>{{ training.category.code || training.category.name }} · {{ training.category.name }}</strong>
              <label>Status
                <select :value="trainingDraft(training).status" @change="setTrainingStatus(training, ($event.target as HTMLSelectElement).value)">
                  <option value="ACTIVE">Active</option>
                  <option value="PAUSED">Paused</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </label>
              <label>Instructor
                <select :value="trainingDraft(training).instructorId ?? ''" @change="setTrainingInstructor(training, ($event.target as HTMLSelectElement).value)">
                  <option value="">Unassigned</option>
                  <option v-for="instructor in dashboard.instructors" :key="instructor.id" :value="instructor.id">{{ instructor.name }}</option>
                </select>
              </label>
              <label>Vehicle
                <select :value="trainingDraft(training).vehicleId ?? ''" @change="setTrainingVehicle(training, ($event.target as HTMLSelectElement).value)">
                  <option value="">Unassigned</option>
                  <option v-for="vehicle in trainingVehicles(training)" :key="vehicle.id" :value="vehicle.id">{{ vehicle.registration }} · {{ vehicle.brand }} {{ vehicle.model }}</option>
                </select>
              </label>
              <button type="submit" class="is-primary" :disabled="!!busyKey">
                {{ busyKey === `training-${training.id}` ? 'Saving…' : 'Save programme' }}
              </button>
            </form>
          </div>
          <p v-else class="dh-manager__hint">No training programme is attached to this student.</p>
        </article>
      </div>
      <div v-else class="dh-manager__empty">Approved applicants will appear here as students.</div>
    </section>

    <section class="dh-manager__section" aria-labelledby="manager-vehicles-title">
      <header class="dh-manager__heading">
        <div><p>Fleet</p><h2 id="manager-vehicles-title">Vehicle management</h2></div>
        <span>{{ dashboard.vehicles.length }} vehicles</span>
      </header>
      <div class="dh-manager__vehicle-layout">
        <form class="dh-manager__form" @submit.prevent="saveVehicle">
          <h3>{{ editingVehicleId ? 'Edit vehicle' : 'Add vehicle' }}</h3>
          <label>Registration<input v-model.trim="vehicleForm.registration" required maxlength="30" placeholder="SK-1234-AB"></label>
          <div class="dh-manager__vehicle-fields">
            <label>Brand<input v-model.trim="vehicleForm.brand" required maxlength="60" placeholder="Volkswagen"></label>
            <label>Model<input v-model.trim="vehicleForm.model" required maxlength="60" placeholder="Golf"></label>
            <label>Year<input v-model.number="vehicleForm.year" type="number" min="1900" max="2100" required></label>
          </div>
          <label>Assigned instructor
            <select v-model="vehicleForm.instructorId">
              <option :value="null">Unassigned</option>
              <option v-for="instructor in dashboard.instructors" :key="instructor.id" :value="instructor.id">{{ instructor.name }}</option>
            </select>
          </label>
          <div class="dh-manager__actions">
            <button type="submit" class="is-primary" :disabled="!!busyKey">
              {{ busyKey === (editingVehicleId ? `vehicle-${editingVehicleId}` : 'vehicle-new') ? 'Saving…' : editingVehicleId ? 'Save vehicle' : 'Add vehicle' }}
            </button>
            <button v-if="editingVehicleId" type="button" :disabled="!!busyKey" @click="resetVehicleForm">Cancel edit</button>
          </div>
        </form>

        <div v-if="dashboard.vehicles.length" class="dh-manager__vehicles">
          <article v-for="vehicle in dashboard.vehicles" :key="vehicle.id">
            <div><strong>{{ vehicle.registration }}</strong><span>{{ vehicle.brand }} {{ vehicle.model }} · {{ vehicle.year }}</span></div>
            <span>{{ dashboard.instructors.find(instructor => instructor.id === vehicle.instructorId)?.name || 'Instructor unassigned' }}</span>
            <div class="dh-manager__vehicle-actions">
              <button type="button" :disabled="!!busyKey" @click="editVehicle(vehicle)">Edit</button>
              <button type="button" class="is-danger" :disabled="!!busyKey" @click="removeVehicle(vehicle)">
                {{ busyKey === `vehicle-remove-${vehicle.id}` ? 'Removing…' : 'Remove' }}
              </button>
            </div>
          </article>
        </div>
        <div v-else class="dh-manager__empty">Add the school’s first vehicle using the form.</div>
      </div>
    </section>

    <div class="dh-manager__columns">
      <section class="dh-manager__section" aria-labelledby="manager-instructors-title">
        <header class="dh-manager__heading">
          <div><p>People</p><h2 id="manager-instructors-title">Instructor roster</h2></div>
        </header>
        <div class="dh-manager__search">
          <label for="manager-user-search">Add an unassigned user by email</label>
          <input id="manager-user-search" v-model="searchEmail" type="search" autocomplete="off" placeholder="Search email address…">
          <small v-if="searchPending">Searching…</small>
          <div v-else-if="searchEmail.trim().length >= 2" class="dh-manager__results">
            <article v-for="candidate in candidates" :key="candidate.id">
              <div><strong>{{ candidate.name }}</strong><span>{{ candidate.email }}</span></div>
              <button type="button" :disabled="!!busyKey" @click="addInstructor(candidate)">{{ busyKey === `add-${candidate.id}` ? 'Adding…' : 'Add instructor' }}</button>
            </article>
            <p v-if="!candidates.length">No unassigned users match that email.</p>
          </div>
        </div>
        <div v-if="dashboard.instructors.length" class="dh-manager__roster">
          <article v-for="instructor in dashboard.instructors" :key="instructor.id">
            <div><strong>{{ instructor.name }}</strong><a :href="`mailto:${instructor.email}`">{{ instructor.email }}</a></div>
            <span>{{ instructor.activeStudents }}/3 active students</span>
            <small>{{ instructor.vehicle.map(vehicle => vehicle.registration).join(', ') || 'No assigned vehicle' }}</small>
            <button type="button" :disabled="!!busyKey" @click="removeInstructor(instructor.id, instructor.name)">{{ busyKey === `remove-${instructor.id}` ? 'Removing…' : 'Remove' }}</button>
          </article>
        </div>
        <div v-else class="dh-manager__empty">Search above to add the school’s first instructor.</div>
      </section>

      <section class="dh-manager__section" aria-labelledby="manager-schedule-title">
        <header class="dh-manager__heading">
          <div><p>Planning</p><h2 id="manager-schedule-title">Schedule a lesson</h2></div>
        </header>
        <form class="dh-manager__form" @submit.prevent="scheduleLesson">
          <label>Student & programme
            <select v-model="scheduleForm.trainingEnrollmentId" required>
              <option :value="null">Choose student</option>
              <option v-for="training in activeTrainings" :key="training.id" :value="training.id">{{ training.student.name }} · {{ training.category.code || training.category.name }}</option>
            </select>
          </label>
          <label>Curriculum lesson
            <select v-model="scheduleForm.curriculumLessonId" :disabled="!selectedTraining" required>
              <option :value="null">Choose lesson</option>
              <option v-for="lesson in selectedTraining?.category.lessons || []" :key="lesson.id" :value="lesson.id">{{ String(lesson.sequence).padStart(2, '0') }} · {{ lesson.title }} ({{ lesson.type.toLowerCase() }})</option>
            </select>
          </label>
          <label>Start time<input v-model="scheduleForm.scheduledStart" type="datetime-local" required></label>
          <label class="dh-manager__check"><input v-model="scheduleForm.includesInstructor" type="checkbox" :disabled="selectedLesson?.type === 'PRACTICAL'"><span>Include an instructor</span></label>
          <p v-if="selectedLesson?.type === 'THEORY'" class="dh-manager__hint">Theory can be scheduled without the student’s assigned driving instructor.</p>
          <p v-else-if="selectedLesson?.type === 'PRACTICAL'" class="dh-manager__hint">Practical lessons always require an instructor.</p>
          <label v-if="scheduleForm.includesInstructor">Instructor
            <select v-model="scheduleForm.instructorId" required>
              <option :value="null">Choose instructor</option>
              <option v-for="instructor in dashboard.instructors" :key="instructor.id" :value="instructor.id">{{ instructor.name }}</option>
            </select>
          </label>
          <label v-if="scheduleForm.includesInstructor">Vehicle (optional)
            <select v-model="scheduleForm.vehicleId"><option :value="null">No vehicle</option><option v-for="vehicle in availableVehicles" :key="vehicle.id" :value="vehicle.id">{{ vehicle.registration }} · {{ vehicle.brand }} {{ vehicle.model }}</option></select>
          </label>
          <label>Notes (optional)<textarea v-model="scheduleForm.notes" rows="3" maxlength="1000" placeholder="Meeting point or lesson note"></textarea></label>
          <button type="submit" class="is-primary" :disabled="!!busyKey || !activeTrainings.length">{{ busyKey === 'schedule' ? 'Scheduling…' : 'Schedule lesson' }}</button>
        </form>
      </section>
    </div>

    <section class="dh-manager__section" aria-labelledby="manager-lessons-title">
      <header class="dh-manager__heading">
        <div><p>Lesson management</p><h2 id="manager-lessons-title">Lessons</h2></div>
        <span>{{ visibleLessons.length }} of {{ dashboard.lessons.length }}</span>
      </header>

      <div class="dh-manager__lesson-filters">
        <label>Search
          <input v-model="lessonSearch" type="search" placeholder="Student, instructor, category or lesson…">
        </label>
        <label>Student
          <select v-model="lessonStudentFilter">
            <option value="all">All students</option>
            <option v-for="student in dashboard.students" :key="student.id" :value="String(student.id)">{{ student.name }}</option>
          </select>
        </label>
        <label>Instructor
          <select v-model="lessonInstructorFilter">
            <option value="all">All instructors</option>
            <option value="none">No instructor</option>
            <option v-for="instructor in dashboard.instructors" :key="instructor.id" :value="String(instructor.id)">{{ instructor.name }}</option>
          </select>
        </label>
        <label>Category
          <select v-model="lessonCategoryFilter">
            <option value="all">All categories</option>
            <option v-for="category in lessonCategories" :key="category.id" :value="String(category.id)">{{ category.code || category.name }}</option>
          </select>
        </label>
        <label>Status
          <select v-model="lessonStatusFilter">
            <option value="all">All statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
      </div>

      <div v-if="visibleLessons.length" class="dh-manager__lessons">
        <article v-for="session in visibleLessons" :key="session.id" :class="`is-${session.status.toLowerCase()}`">
          <div class="dh-manager__lesson-row">
            <time :datetime="session.scheduledStart">
              <strong>{{ dateTimeFormatter.format(new Date(session.scheduledStart)) }}</strong>
              <small>{{ session.lesson.durationMinutes }} minutes</small>
            </time>
            <div class="dh-manager__lesson-person">
              <strong>{{ session.student.name }}</strong>
              <span>{{ session.student.email }}</span>
            </div>
            <div class="dh-manager__lesson-name">
              <strong>{{ session.category.code || session.category.name }} · {{ session.lesson.title }}</strong>
              <span>{{ session.lesson.type.toLowerCase() }} · {{ session.instructor?.name || 'No instructor' }}<template v-if="session.vehicle"> · {{ session.vehicle.registration }}</template></span>
            </div>
            <span class="dh-manager__lesson-status">{{ session.status.toLowerCase() }}</span>
            <div v-if="session.status === 'SCHEDULED'" class="dh-manager__lesson-actions">
              <button type="button" class="is-primary" :disabled="!!busyKey || !canComplete(session)" :title="canComplete(session) ? 'Mark lesson completed' : 'Available when the lesson starts'" @click="completeLesson(session)">
                {{ busyKey === `complete-${session.id}` ? 'Saving…' : 'Complete' }}
              </button>
              <button type="button" :disabled="!!busyKey" @click="startReschedule(session)">Reschedule</button>
              <button type="button" class="is-danger" :disabled="!!busyKey" @click="cancelLesson(session)">Cancel</button>
            </div>
            <span v-else class="dh-manager__lesson-finished">
              {{ session.status === 'COMPLETED' && session.completedAt ? `Completed ${dateTimeFormatter.format(new Date(session.completedAt))}` : 'No further actions' }}
            </span>
          </div>

          <form v-if="rescheduleLessonId === session.id" class="dh-manager__reschedule" @submit.prevent="submitReschedule(session)">
            <label>New start time<input v-model="rescheduleForm.scheduledStart" type="datetime-local" required></label>
            <label class="dh-manager__check"><input v-model="rescheduleForm.includesInstructor" type="checkbox" :disabled="selectedRescheduleLesson?.lesson.type === 'PRACTICAL'"><span>Include an instructor</span></label>
            <label v-if="rescheduleForm.includesInstructor">Instructor
              <select v-model="rescheduleForm.instructorId" required>
                <option :value="null">Choose instructor</option>
                <option v-for="instructor in dashboard.instructors" :key="instructor.id" :value="instructor.id">{{ instructor.name }}</option>
              </select>
            </label>
            <label v-if="rescheduleForm.includesInstructor">Vehicle
              <select v-model="rescheduleForm.vehicleId">
                <option :value="null">No vehicle</option>
                <option v-for="vehicle in rescheduleVehicles" :key="vehicle.id" :value="vehicle.id">{{ vehicle.registration }} · {{ vehicle.brand }} {{ vehicle.model }}</option>
              </select>
            </label>
            <div class="dh-manager__reschedule-actions">
              <button type="submit" class="is-primary" :disabled="!!busyKey">{{ busyKey === `reschedule-${session.id}` ? 'Saving…' : 'Save new time' }}</button>
              <button type="button" :disabled="!!busyKey" @click="cancelReschedule">Keep current booking</button>
            </div>
          </form>
        </article>
      </div>
      <div v-else class="dh-manager__empty">No lessons match these filters.</div>
    </section>
  </div>
</template>

<style scoped>
.dh-manager { padding-bottom: 1rem; }
.dh-manager__summary { position: relative; z-index: 2; display: grid; margin-top: -2.5rem; grid-template-columns: repeat(4, minmax(0, 1fr)); border: 1px solid var(--dh-color-border-strong); background: #fff; }
.dh-manager__summary article { display: flex; min-height: 9.5rem; padding: 1.5rem; flex-direction: column; justify-content: space-between; border-right: 1px solid var(--dh-color-border-default); }
.dh-manager__summary article:last-child { border-right: 0; }
.dh-manager__summary span, .dh-manager__heading p, .dh-manager label, .dh-manager dt { color: var(--dh-color-text-secondary); font-size: .68rem; font-weight: 800; letter-spacing: .055rem; text-transform: uppercase; }
.dh-manager__summary strong { font-family: 'Barlow Condensed', sans-serif; font-size: 3rem; line-height: 1; }
.dh-manager__summary small { color: var(--dh-color-text-secondary); }
.dh-manager__notice { margin-top: 1.5rem; padding: .9rem 1rem; border-left: .3rem solid #477900; background: #eff9df; color: #284800; }
.dh-manager__notice.is-error { border-color: #c93827; background: #fff0ed; color: #8f2619; }
.dh-manager__section { margin-top: 3.5rem; }
.dh-manager__heading { display: flex; margin-bottom: 1.25rem; align-items: end; justify-content: space-between; gap: 1rem; }
.dh-manager__heading p { margin: 0; color: var(--dh-color-bg-accent); }
.dh-manager__heading h2 { margin: .25rem 0 0; font-family: 'Barlow Condensed', sans-serif; font-size: clamp(2.25rem, 4vw, 3.5rem); line-height: 1; text-transform: uppercase; }
.dh-manager__heading > span { color: var(--dh-color-text-secondary); font-size: .75rem; font-weight: 700; text-transform: uppercase; }
.dh-manager__applications { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.dh-manager__applications > article, .dh-manager__search, .dh-manager__form { padding: 1.5rem; border: 1px solid var(--dh-color-border-strong); background: #fff; }
.dh-manager__applicant { display: flex; align-items: center; gap: .9rem; }
.dh-manager__applicant > span { display: grid; width: 2.8rem; height: 2.8rem; flex: 0 0 auto; place-items: center; background: var(--dh-color-bg-inverse); color: var(--dh-color-bg-status); font-weight: 900; }
.dh-manager h3 { margin: 0; font-size: 1rem; }
.dh-manager a { color: var(--dh-color-text-secondary); font-size: .75rem; }
.dh-manager dl { display: grid; margin: 1.25rem 0; grid-template-columns: repeat(3, 1fr); gap: .75rem; }
.dh-manager dd { margin: .3rem 0 0; font-size: .78rem; }
.dh-manager label { display: flex; flex-direction: column; gap: .45rem; }
.dh-manager select, .dh-manager input, .dh-manager textarea { width: 100%; min-height: 2.85rem; padding: .7rem .8rem; border: 1px solid var(--dh-color-border-strong); border-radius: 0; background: #fff; color: var(--dh-color-text-primary); font: inherit; text-transform: none; }
.dh-manager textarea { resize: vertical; }
.dh-manager__actions { display: flex; margin-top: 1rem; gap: .6rem; }
.dh-manager button { min-height: 2.75rem; padding: .65rem .9rem; border: 1px solid var(--dh-color-border-strong); border-radius: 0; background: #fff; color: var(--dh-color-text-primary); font-weight: 800; text-transform: uppercase; cursor: pointer; }
.dh-manager button.is-primary { background: var(--dh-color-bg-accent); color: #fff; }
.dh-manager button:disabled { cursor: wait; opacity: .55; }
.dh-manager__history { margin-top: 1rem; border: 1px solid var(--dh-color-border-default); background: #fff; }
.dh-manager__history summary { padding: 1rem; cursor: pointer; font-size: .75rem; font-weight: 800; text-transform: uppercase; }
.dh-manager__history p { display: grid; margin: 0; padding: .75rem 1rem; grid-template-columns: 1fr 8rem 6rem; border-top: 1px solid var(--dh-color-border-default); font-size: .8rem; }
.dh-manager__history em { font-style: normal; font-weight: 800; text-transform: uppercase; }
.dh-manager__history .is-approved { color: #477900; }.dh-manager__history .is-rejected, .dh-manager__history .is-cancelled { color: #a42d20; }
.dh-manager__students { border: 1px solid var(--dh-color-border-strong); background: #fff; }
.dh-manager__students > article { padding: 1rem; border-bottom: 1px solid var(--dh-color-border-default); }
.dh-manager__students article:last-child { border-bottom: 0; }
.dh-manager__student-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.dh-manager__student-identity { display: flex; min-width: 0; flex-direction: column; gap: .25rem; }
.dh-manager__student-trainings { display: grid; margin-top: 1rem; gap: .75rem; }
.dh-manager__student-trainings form { display: grid; padding: .85rem; grid-template-columns: minmax(10rem, 1.2fr) repeat(3, minmax(9rem, 1fr)) auto; align-items: end; gap: .65rem; border: 1px solid var(--dh-color-border-default); background: #f7f8f7; }
.dh-manager__student-trainings form > strong { align-self: center; font-size: .82rem; }
.dh-manager__columns { display: grid; grid-template-columns: minmax(0, 1.08fr) minmax(22rem, .92fr); gap: 2rem; }
.dh-manager__search small { display: block; margin-top: .6rem; color: var(--dh-color-text-secondary); }
.dh-manager__results { margin-top: .75rem; border: 1px solid var(--dh-color-border-default); }
.dh-manager__results article { display: flex; padding: .75rem; align-items: center; justify-content: space-between; gap: 1rem; border-bottom: 1px solid var(--dh-color-border-default); }
.dh-manager__results article:last-child { border-bottom: 0; }
.dh-manager__results div, .dh-manager__roster div { display: flex; min-width: 0; flex-direction: column; gap: .2rem; }
.dh-manager__results span { color: var(--dh-color-text-secondary); font-size: .75rem; }
.dh-manager__results p { margin: 0; padding: .8rem; color: var(--dh-color-text-secondary); font-size: .8rem; }
.dh-manager__roster { border: 1px solid var(--dh-color-border-strong); border-top: 0; background: #fff; }
.dh-manager__roster article { display: grid; padding: 1rem; grid-template-columns: minmax(10rem, 1fr) auto minmax(7rem, auto) auto; align-items: center; gap: 1rem; border-bottom: 1px solid var(--dh-color-border-default); }
.dh-manager__roster article:last-child { border-bottom: 0; }
.dh-manager__roster span, .dh-manager__roster small { color: var(--dh-color-text-secondary); font-size: .72rem; }
.dh-manager__form { display: grid; gap: .9rem; }
.dh-manager__vehicle-layout { display: grid; grid-template-columns: minmax(20rem, .72fr) minmax(0, 1.28fr); gap: 1rem; align-items: start; }
.dh-manager__vehicle-fields { display: grid; grid-template-columns: repeat(3, 1fr); gap: .65rem; }
.dh-manager__vehicles { border: 1px solid var(--dh-color-border-strong); background: #fff; }
.dh-manager__vehicles article { display: grid; min-height: 4.75rem; padding: 1rem; grid-template-columns: minmax(11rem, 1fr) minmax(10rem, 1fr) auto; align-items: center; gap: 1rem; border-bottom: 1px solid var(--dh-color-border-default); }
.dh-manager__vehicles article:last-child { border-bottom: 0; }
.dh-manager__vehicles article > div:first-child { display: flex; min-width: 0; flex-direction: column; gap: .25rem; }
.dh-manager__vehicles article span { color: var(--dh-color-text-secondary); font-size: .75rem; }
.dh-manager__vehicle-actions { display: flex; gap: .45rem; }
.dh-manager__vehicle-actions button { min-height: 2.35rem; padding: .5rem .65rem; font-size: .68rem; }
.dh-manager__check { display: flex !important; min-height: 2rem; flex-direction: row !important; align-items: center; }
.dh-manager__check input { width: 1rem; min-height: 1rem; }
.dh-manager__hint { margin: -.35rem 0 0; color: var(--dh-color-text-secondary); font-size: .75rem; line-height: 1.45; }
.dh-manager__lesson-filters { display: grid; margin-bottom: 1rem; padding: 1rem; grid-template-columns: minmax(14rem, 1.4fr) repeat(4, minmax(9rem, 1fr)); gap: .75rem; border: 1px solid var(--dh-color-border-strong); background: #fff; }
.dh-manager__lessons { display: grid; gap: .75rem; }
.dh-manager__lessons > article { border: 1px solid var(--dh-color-border-strong); border-left-width: .35rem; background: #fff; }
.dh-manager__lessons > article.is-completed { border-left-color: #6aa113; }
.dh-manager__lessons > article.is-cancelled { border-left-color: #c93827; opacity: .78; }
.dh-manager__lesson-row { display: grid; min-height: 5.25rem; padding: 1rem; grid-template-columns: 11rem minmax(10rem, .8fr) minmax(15rem, 1.5fr) 6.5rem minmax(15rem, auto); align-items: center; gap: 1rem; }
.dh-manager__lesson-row time, .dh-manager__lesson-person, .dh-manager__lesson-name { display: flex; min-width: 0; flex-direction: column; gap: .25rem; }
.dh-manager__lesson-row time strong, .dh-manager__lesson-person strong, .dh-manager__lesson-name strong { font-size: .82rem; line-height: 1.4; }
.dh-manager__lesson-row time small, .dh-manager__lesson-person span, .dh-manager__lesson-name span, .dh-manager__lesson-finished { color: var(--dh-color-text-secondary); font-size: .75rem; line-height: 1.4; }
.dh-manager__lesson-status { padding: .45rem .55rem; border: 1px solid var(--dh-color-border-default); font-size: .7rem; font-weight: 900; text-align: center; text-transform: uppercase; }
.is-completed .dh-manager__lesson-status { border-color: #8fbd47; color: #477900; }
.is-cancelled .dh-manager__lesson-status { border-color: #e4a49c; color: #a42d20; }
.dh-manager__lesson-actions { display: flex; justify-content: flex-end; gap: .45rem; }
.dh-manager__lesson-actions button { min-height: 2.4rem; padding: .5rem .65rem; font-size: .7rem; }
.dh-manager button.is-danger { border-color: #c93827; color: #a42d20; }
.dh-manager__lesson-finished { text-align: right; }
.dh-manager__reschedule { display: grid; padding: 1rem; grid-template-columns: minmax(12rem, 1fr) minmax(10rem, .8fr) minmax(10rem, 1fr) minmax(10rem, 1fr); align-items: end; gap: .75rem; border-top: 1px solid var(--dh-color-border-default); background: #f4f5f1; }
.dh-manager__reschedule-actions { display: flex; grid-column: 1 / -1; gap: .6rem; }
.dh-manager__empty { padding: 2rem; border: 1px dashed var(--dh-color-border-strong); background: #fff; color: var(--dh-color-text-secondary); text-align: center; }
@media (max-width: 78rem) { .dh-manager__student-trainings form { grid-template-columns: repeat(2, minmax(10rem, 1fr)); }.dh-manager__lesson-filters { grid-template-columns: repeat(3, 1fr); }.dh-manager__lesson-row { grid-template-columns: 10rem minmax(10rem, .8fr) minmax(14rem, 1.4fr); }.dh-manager__lesson-actions, .dh-manager__lesson-finished { grid-column: 2 / -1; justify-content: flex-start; text-align: left; } }
@media (max-width: 70rem) { .dh-manager__columns, .dh-manager__applications, .dh-manager__vehicle-layout { grid-template-columns: 1fr; }.dh-manager__summary { grid-template-columns: repeat(2, 1fr); }.dh-manager__reschedule { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 44rem) { .dh-manager__summary, .dh-manager__lesson-filters, .dh-manager__student-trainings form, .dh-manager__vehicle-fields { grid-template-columns: 1fr; }.dh-manager__summary article { min-height: 7rem; border-right: 0; border-bottom: 1px solid var(--dh-color-border-default); }.dh-manager__roster article, .dh-manager__vehicles article, .dh-manager__lesson-row, .dh-manager__reschedule { grid-template-columns: 1fr; }.dh-manager__student-header { align-items: flex-start; flex-direction: column; }.dh-manager__lesson-actions, .dh-manager__lesson-finished, .dh-manager__reschedule-actions { grid-column: auto; }.dh-manager dl { grid-template-columns: 1fr; }.dh-manager__history p { grid-template-columns: 1fr; gap: .25rem; }.dh-manager__columns { display: block; }.dh-manager__applications > article, .dh-manager__search, .dh-manager__form { padding: 1rem; }.dh-manager__lesson-actions, .dh-manager__reschedule-actions, .dh-manager__vehicle-actions { flex-wrap: wrap; } }
</style>
