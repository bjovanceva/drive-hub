import { requireOrdinaryUser } from '../../../utils/authorization'
import { ChatService } from '../../../services/ChatService'

export default defineEventHandler(async (event) => {
  const user = await requireOrdinaryUser(event)
  return new ChatService().sendMessage(user.id, getRouterParam(event, 'id'), await readBody(event))
})
