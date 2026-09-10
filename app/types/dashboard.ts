export type DashboardView = 'STUDENT' | 'INSTRUCTOR' | 'MANAGER' | 'APPLICANT'
export type TrainingStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'
export type LessonType = 'THEORY' | 'PRACTICAL'
export type LessonSessionStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'

export interface DashboardLessonSession {
  id: number
  curriculumLessonId: number
  status: LessonSessionStatus
  scheduledStart: string
  scheduledEnd: string
  startedAt: string | null
  completedAt: string | null
  notes: string | null
  instructor: { id: number; name: string } | null
  vehicle: { id: number; registration: string; brand: string; model: string } | null
}

export interface DashboardLesson {
  id: number
  sequence: number
  type: LessonType
  title: string
  concept: string
  goal: string
  durationMinutes: number
  completed: boolean
  sessions: DashboardLessonSession[]
}

export interface StudentTraining {
  id: number
  status: TrainingStatus
  startedAt: string
  completedAt: string | null
  school: { id: number; name: string; city: string | null; email: string; phone: string }
  category: { id: number; code: string | null; name: string }
  instructor: { id: number; name: string } | null
  vehicle: {
    id: number
    registration: string
    brand: string
    model: string
    year: number
  } | null
  progress: {
    completedLessons: number
    requiredLessons: number
    definedLessons: number
    percentage: number
    theory: { completed: number; required: number }
    practical: { completed: number; required: number }
  }
  nextLesson: Omit<DashboardLesson, 'completed' | 'sessions'> | null
  upcomingSession: DashboardLessonSession | null
  lessons: DashboardLesson[]
}

export interface InstructorScheduleItem {
  id: number
  status: LessonSessionStatus
  scheduledStart: string
  scheduledEnd: string
  startedAt: string | null
  completedAt: string | null
  notes: string | null
  student: { id: number; name: string; email: string }
  category: { id: number; code: string | null; name: string }
  lesson: {
    id: number
    sequence: number
    type: LessonType
    title: string
    goal: string
    durationMinutes: number
  }
  vehicle: { id: number; registration: string; brand: string; model: string } | null
}

export interface InstructorStudent {
  trainingId: number
  status: TrainingStatus
  startedAt: string
  student: { id: number; name: string; email: string }
  category: { id: number; code: string | null; name: string }
  vehicle: {
    id: number
    registration: string
    brand: string
    model: string
  } | null
  progress: {
    completedLessons: number
    requiredLessons: number
    percentage: number
  }
  nextLesson: {
    id: number
    sequence: number
    type: LessonType
    title: string
  } | null
  upcomingSessionAt: string | null
}

export interface InstructorVehicle {
  id: number
  registration: string
  brand: string
  model: string
  year: number
}

export interface ManagerApplication {
  id: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  startedAt: string
  userId: number
  drivingSchoolId: number
  categoryId: number
  preferredInstructorId: number | null
  user: { id: number; name: string; email: string }
  category: { id: number; code: string | null; name: string }
  preferredInstructor: { id: number; name: string } | null
  trainingEnrollment: { id: number; instructorId: number | null } | null
}

export interface ManagerInstructor {
  id: number
  name: string
  email: string
  activeStudents: number
  vehicle: Array<{ id: number; registration: string; brand: string; model: string }>
}

export interface ManagerTraining {
  id: number
  status: TrainingStatus
  student: { id: number; name: string; email: string }
  category: {
    id: number
    code: string | null
    name: string
    lessons: Array<{
      id: number
      sequence: number
      type: LessonType
      title: string
      durationMinutes: number
    }>
  }
  instructor: { id: number; name: string } | null
  vehicle: { id: number; registration: string; brand: string; model: string } | null
}

export interface ManagerLessonItem {
  id: number
  status: LessonSessionStatus
  scheduledStart: string
  scheduledEnd: string
  startedAt: string | null
  completedAt: string | null
  notes: string | null
  student: { id: number; name: string; email: string }
  category: { id: number; code: string | null; name: string }
  lesson: {
    id: number
    sequence: number
    type: LessonType
    title: string
    durationMinutes: number
  }
  instructor: { id: number; name: string } | null
  vehicle: { id: number; registration: string; brand: string; model: string } | null
}

export interface ManagerStudent {
  id: number
  name: string
  email: string
  trainingAsStudent: Array<{
    id: number
    status: TrainingStatus
    category: { id: number; code: string | null; name: string }
    instructor: { id: number; name: string } | null
    vehicle: { id: number; registration: string; brand: string; model: string } | null
  }>
}

export interface ManagerVehicle {
  id: number
  registration: string
  brand: string
  model: string
  year: number
  instructorId: number | null
}

export type DashboardResponse =
  | {
      view: 'STUDENT'
      summary: {
        currentTrainings: number
        completedLessons: number
        nextSessionAt: string | null
      }
      trainings: StudentTraining[]
    }
  | {
      view: 'INSTRUCTOR'
      school: { id: number; name: string; city: string | null }
      summary: {
        lessonsToday: number
        upcomingLessons: number
        activeStudents: number
        completedLessons: number
      }
      schedule: InstructorScheduleItem[]
      students: InstructorStudent[]
      vehicles: InstructorVehicle[]
    }
  | {
      view: 'MANAGER'
      school: { id: number; name: string; city: string | null; email: string; phone: string }
      summary: {
        pendingApplications: number
        instructors: number
        activeStudents: number
        vehicles: number
      }
      applications: ManagerApplication[]
      instructors: ManagerInstructor[]
      students: ManagerStudent[]
      trainings: ManagerTraining[]
      lessons: ManagerLessonItem[]
      vehicles: ManagerVehicle[]
    }
  | { view: 'APPLICANT' }
