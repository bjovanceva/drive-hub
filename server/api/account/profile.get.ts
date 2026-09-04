import { requireOrdinaryUser } from '../../utils/authorization'

export default defineEventHandler(async (event) => {
  return { user: await requireOrdinaryUser(event) }
})
