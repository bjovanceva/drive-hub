import { z } from 'zod'
import { registerUserSchema } from './auth.ts'

const id = z.number().int().positive()
const optionalId = id.nullable()
export const adminResourceSchema = z.enum(['users', 'schools', 'applications', 'vehicles'])
export const adminIdSchema = z.coerce.number().int().positive()
export const adminResourceParamsSchema = z.object({ resource: adminResourceSchema })
export const adminEntityParamsSchema = z.object({
  resource: adminResourceSchema,
  id: adminIdSchema
})
export const adminUserSchema = z
  .object({
    name: registerUserSchema.shape.name,
    email: registerUserSchema.shape.email,
    password: registerUserSchema.shape.password.optional(),
    studentSchoolId: optionalId,
    instructorSchoolId: optionalId,
    managedSchoolId: optionalId
  })
  .strict()
  .refine(
    (data) =>
      [data.studentSchoolId, data.instructorSchoolId, data.managedSchoolId].filter(
        (id) => id !== null
      ).length <= 1,
    { message: 'A user can only be a student, instructor, or manager at one time.' }
  )
export const adminSchoolSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    email: z.string().trim().toLowerCase().email(),
    phone: z.string().trim().min(1).max(50),
    address: z.string().trim().min(1).max(240),
    city: z.string().trim().max(100),
    description: z.string().trim().max(4000),
    managerId: optionalId,
    categoryIds: z
      .array(id)
      .max(100)
      .transform((ids) => [...new Set(ids)])
  })
  .strict()
export const adminApplicationSchema = z
  .object({
    userId: id,
    drivingSchoolId: id,
    categoryId: id,
    preferredInstructorId: optionalId,
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'])
  })
  .strict()
export const adminVehicleSchema = z
  .object({
    registration: z.string().trim().min(1).max(40),
    brand: z.string().trim().min(1).max(80),
    model: z.string().trim().min(1).max(80),
    year: z
      .number()
      .int()
      .min(1900)
      .max(new Date().getFullYear() + 1),
    drivingSchoolId: id,
    instructorId: optionalId
  })
  .strict()

export const adminMembershipSchema = z
  .object({ kind: z.enum(['student', 'instructor']), schoolId: id })
  .strict()
