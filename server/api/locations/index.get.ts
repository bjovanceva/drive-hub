import { DrivingSchoolService } from '../../services/DrivingSchoolService'

export default defineEventHandler(async () => {
  const service = new DrivingSchoolService()
  
  const locations = await service.getLocations()
  return locations.map(location => ({
      value: location.toLowerCase(),
      label: location
    }))
})