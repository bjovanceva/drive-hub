import { DrivingSchoolService } from '../../services/DrivingSchoolService'

export default defineEventHandler(async () => {
  const service = new DrivingSchoolService()

  return service.getAllDrivingSchools()
})