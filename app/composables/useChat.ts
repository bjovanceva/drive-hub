export interface ChatMessage {
  id: number
  conversationId: number
  senderId: number
  content: string
  createdAt: string

  sender: {
    id: number
    name: string
  }
}

export function useChat(conversationId: MaybeRef<string>) {
  const messages = ref<ChatMessage[]>([])
  const loading = ref(false)
  const error = ref('')
  const requestFetch = useRequestFetch()
  let loadVersion = 0
  const { lastMessage, revision } = useChatRealtime()

  function mergeMessages(incoming: ChatMessage[]) {
    const unique = new Map(messages.value.map(message => [message.id, message]))
    for (const message of incoming) unique.set(message.id, message)
    messages.value = [...unique.values()].sort((a, b) =>
      Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id - b.id)
  }

  watch(lastMessage, message => {
    if (message && String(message.conversationId) === toValue(conversationId)) {
      mergeMessages([message])
    }
  })
  watch(revision, () => { void loadMessages() })

  async function loadMessages() {
    const version = ++loadVersion
    loading.value = true
    error.value = ''
    messages.value = []

    try {
      const result = await requestFetch<ChatMessage[]>(
        `/api/conversations/${toValue(conversationId)}/messages`
      )
      if (version === loadVersion) mergeMessages(result)
    } catch {
      if (version === loadVersion) error.value = 'Unable to load messages. Please try again.'
    } finally {
      if (version === loadVersion) loading.value = false
    }
  }

  async function sendMessage(content: string) {
    const targetId = toValue(conversationId)
    const message = await $fetch<ChatMessage>(
      `/api/conversations/${targetId}/messages`,
      {
        method: 'POST',
        body: {
          content
        }
      }
    )

    if (targetId === toValue(conversationId)) mergeMessages([message])

    return message
  }

  return {
    messages,
    loading,
    error,
    loadMessages,
    sendMessage
  }
}
