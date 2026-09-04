import { adminVehicleSchema } from '../../validation/admin.ts'
import { school as requireSchool, instructor, type Transaction } from './relations.ts'
export async function saveVehicle(tx: Transaction, id: number | null, input: unknown) {
  const data = adminVehicleSchema.parse(input)
  await requireSchool(tx, data.drivingSchoolId)
  await instructor(tx, data.instructorId, data.drivingSchoolId)
  const vehicle =
    id === null
      ? await tx.vehicle.create({ data })
      : await tx.vehicle.update({ where: { id }, data })
  return { id: vehicle.id }
}
