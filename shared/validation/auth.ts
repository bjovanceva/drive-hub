import { z } from 'zod'

const password = z.string({ error: 'Enter a password' })
  .min(8, 'Password must contain at least 8 characters')
  .max(128, 'Password must contain at most 128 characters')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

export const registerUserSchema = z.object({
  name: z.string({ error: 'Enter your full name' }).trim().min(2, 'Full name must contain at least 2 characters').max(80, 'Full name must contain at most 80 characters'),
  email: z.string({ error: 'Enter an email address' }).trim().toLowerCase().email('Enter a valid email address'),
  password
})

export const loginUserSchema = z.object({
  email: z.string({ error: 'Enter an email address' }).trim().toLowerCase().email('Enter a valid email address'),
  password: z.string({ error: 'Enter your password' }).min(1, 'Enter your password').max(128, 'Password must contain at most 128 characters')
})

export const updateProfileSchema = z.object({
  name: z.string({ error: 'Enter your full name' }).trim().min(2, 'Full name must contain at least 2 characters').max(80, 'Full name must contain at most 80 characters'),
  email: z.string({ error: 'Enter an email address' }).trim().toLowerCase().email('Enter a valid email address'),
  phone: z.string().trim().max(40).regex(/^[+0-9().\s-]*$/, 'Enter a valid phone number').nullable().optional(),
  currentPassword: z.string().max(128).optional()
}).strict()

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password').max(128),
  newPassword: password
}).strict()
