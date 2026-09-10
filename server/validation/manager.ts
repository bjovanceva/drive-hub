import { z } from 'zod'

const id = z.coerce.number().int().positive()

export const managerIdParamsSchema = z.object({ id })

export const approveApplicationSchema = z.object({
  instructorId: z.number().int().positive()
}).strict()

export const addInstructorSchema = z.object({
  userId: z.number().int().positive()
}).strict()

export const updateTrainingSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']),
  instructorId: z.number().int().positive().nullable(),
  vehicleId: z.number().int().positive().nullable()
}).strict()

const vehicleFields = {
  registration: z.string().trim().min(2).max(30),
  brand: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(60),
  year: z.number().int().min(1900).max(2100),
  instructorId: z.number().int().positive().nullable()
}

export const createManagerVehicleSchema = z.object(vehicleFields).strict()
export const updateManagerVehicleSchema = z.object(vehicleFields).strict()

export const scheduleLessonSchema = z.object({
  trainingEnrollmentId: z.number().int().positive(),
  curriculumLessonId: z.number().int().positive(),
  scheduledStart: z.string().datetime({ offset: true }),
  instructorId: z.number().int().positive().nullable(),
  vehicleId: z.number().int().positive().nullable(),
  notes: z.string().trim().max(1000).nullable().default(null)
}).strict()

export const updateLessonSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('complete') }).strict(),
  z.object({ action: z.literal('cancel') }).strict(),
  z.object({
    action: z.literal('reschedule'),
    scheduledStart: z.string().datetime({ offset: true }),
    instructorId: z.number().int().positive().nullable(),
    vehicleId: z.number().int().positive().nullable()
  }).strict()
])
