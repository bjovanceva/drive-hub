import type { PrismaClient } from '../../app/generated/prisma/client.ts'
import prisma from '../utils/prisma.ts'

type DashboardUser = {
  id: number
  studentSchoolId: number | null
  instructorSchoolId: number | null
  managedSchoolId: number | null
}

/** Builds the role-aware dashboard payload. Only the student view is populated for now. */
export class DashboardService {
  constructor(
    private database: PrismaClient = prisma,
    private now: () => Date = () => new Date()
  ) {}

  async overview(user: DashboardUser) {
    if (user.studentSchoolId !== null) return this.studentOverview(user.id)
    if (user.instructorSchoolId !== null) return { view: 'INSTRUCTOR' as const }
    if (user.managedSchoolId !== null) return { view: 'MANAGER' as const }
    return { view: 'APPLICANT' as const }
  }

  private async studentOverview(studentId: number) {
    const enrollments = await this.database.trainingEnrollment.findMany({
      where: { studentId },
      orderBy: { startedAt: 'desc' },
      include: {
        drivingSchool: {
          select: { id: true, name: true, city: true, email: true, phone: true }
        },
        category: {
          include: { lessons: { orderBy: { sequence: 'asc' } } }
        },
        instructor: { select: { id: true, name: true } },
        vehicle: {
          select: { id: true, registration: true, brand: true, model: true, year: true }
        },
        lessonSessions: {
          orderBy: { scheduledStart: 'desc' },
          include: {
            instructor: { select: { id: true, name: true } },
            vehicle: {
              select: { id: true, registration: true, brand: true, model: true }
            }
          }
        }
      }
    })
    const currentTime = this.now().getTime()
    const trainings = enrollments.map((enrollment) => {
      const categoryLessonIds = new Set(enrollment.category.lessons.map((lesson) => lesson.id))
      const completedLessonIds = new Set(
        enrollment.lessonSessions
          .filter(
            (session) =>
              session.status === 'COMPLETED' && categoryLessonIds.has(session.curriculumLessonId)
          )
          .map((session) => session.curriculumLessonId)
      )
      const completedTheoryLessons = enrollment.category.lessons.filter(
        (lesson) => lesson.type === 'THEORY' && completedLessonIds.has(lesson.id)
      ).length
      const completedPracticalLessons = enrollment.category.lessons.filter(
        (lesson) => lesson.type === 'PRACTICAL' && completedLessonIds.has(lesson.id)
      ).length
      const requiredLessons =
        enrollment.category.theoryLessons + enrollment.category.practicalLessons
      const nextLesson = enrollment.category.lessons.find(
        (lesson) => !completedLessonIds.has(lesson.id)
      )
      const sessions = enrollment.lessonSessions.map((session) => ({
        id: session.id,
        curriculumLessonId: session.curriculumLessonId,
        status: session.status,
        scheduledStart: session.scheduledStart,
        scheduledEnd: session.scheduledEnd,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        notes: session.notes,
        instructor: session.instructor,
        vehicle: session.vehicle
      }))
      const upcomingSession = sessions
        .filter(
          (session) =>
            session.status === 'SCHEDULED' && session.scheduledEnd.getTime() >= currentTime
        )
        .sort((left, right) => left.scheduledStart.getTime() - right.scheduledStart.getTime())[0]

      return {
        id: enrollment.id,
        status: enrollment.status,
        startedAt: enrollment.startedAt,
        completedAt: enrollment.completedAt,
        school: enrollment.drivingSchool,
        category: {
          id: enrollment.category.id,
          code: enrollment.category.code,
          name: enrollment.category.name
        },
        instructor: enrollment.instructor,
        vehicle: enrollment.vehicle,
        progress: {
          completedLessons: completedLessonIds.size,
          requiredLessons,
          definedLessons: enrollment.category.lessons.length,
          percentage:
            requiredLessons === 0
              ? 0
              : Math.min(100, Math.round((completedLessonIds.size / requiredLessons) * 100)),
          theory: {
            completed: completedTheoryLessons,
            required: enrollment.category.theoryLessons
          },
          practical: {
            completed: completedPracticalLessons,
            required: enrollment.category.practicalLessons
          }
        },
        nextLesson: nextLesson
          ? {
              id: nextLesson.id,
              sequence: nextLesson.sequence,
              type: nextLesson.type,
              title: nextLesson.title,
              concept: nextLesson.concept,
              goal: nextLesson.goal,
              durationMinutes: nextLesson.durationMinutes
            }
          : null,
        upcomingSession: upcomingSession ?? null,
        lessons: enrollment.category.lessons.map((lesson) => ({
          id: lesson.id,
          sequence: lesson.sequence,
          type: lesson.type,
          title: lesson.title,
          concept: lesson.concept,
          goal: lesson.goal,
          durationMinutes: lesson.durationMinutes,
          completed: completedLessonIds.has(lesson.id),
          sessions: sessions.filter((session) => session.curriculumLessonId === lesson.id)
        }))
      }
    })
    const upcomingSessions = trainings
      .flatMap((training) =>
        training.upcomingSession
          ? [{ trainingId: training.id, session: training.upcomingSession }]
          : []
      )
      .sort(
        (left, right) =>
          left.session.scheduledStart.getTime() - right.session.scheduledStart.getTime()
      )

    return {
      view: 'STUDENT' as const,
      summary: {
        currentTrainings: trainings.filter(
          (training) => training.status === 'ACTIVE' || training.status === 'PAUSED'
        ).length,
        completedLessons: trainings.reduce(
          (total, training) => total + training.progress.completedLessons,
          0
        ),
        nextSessionAt: upcomingSessions[0]?.session.scheduledStart ?? null
      },
      trainings
    }
  }
}
