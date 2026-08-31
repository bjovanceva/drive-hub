
export const useDrivingSchools = () => {
  const getDrivingSchools = () => {
    return $fetch('/api/driving-schools')
  }

  const getLocations = () => {
    return $fetch('/api/locations')
  }

  return {
    getDrivingSchools,
    getLocations
  }
}