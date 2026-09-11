export default defineNuxtPlugin(() => {
  const { user, loggedIn } = useUserSession()
  const { status, revision, lastMessage } = useChatRealtime()
  let socket: WebSocket | undefined
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined
  let heartbeat: ReturnType<typeof setInterval> | undefined
  let attempts = 0
  let lastSeen = 0
  const enabled = computed(() => loggedIn.value && user.value?.role === 'USER')

  function stop() {
    clearTimeout(reconnectTimer)
    clearInterval(heartbeat)
    const previous = socket
    socket = undefined
    previous?.close()
    status.value = 'offline'
  }

  function connect() {
    if (!enabled.value) return
    status.value = 'connecting'
    const url = new URL('/ws/chat', window.location.href)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    const current = new WebSocket(url)
    socket = current

    current.onmessage = (event) => {
      if (socket !== current) return
      lastSeen = Date.now()
      try {
        const payload = JSON.parse(event.data)
        if (payload.type === 'ready') {
          attempts = 0
          status.value = 'connected'
          revision.value++
          heartbeat = setInterval(() => {
            if (Date.now() - lastSeen > 60000) current.close()
            else if (current.readyState === WebSocket.OPEN) current.send('ping')
          }, 20000)
        } else if (payload.type === 'message.created' && payload.message?.id) {
          lastMessage.value = payload.message
        }
      } catch {
        // Ignore malformed events; persisted history remains authoritative.
      }
    }
    current.onerror = () => current.close()
    current.onclose = (event) => {
      if (socket !== current) return
      clearInterval(heartbeat)
      socket = undefined
      status.value = 'offline'
      if (enabled.value && event.code !== 1008) {
        reconnectTimer = setTimeout(connect, Math.min(1000 * 2 ** attempts++, 30000))
      }
    }
  }

  const unwatch = watch(() => enabled.value ? user.value?.id : null, () => {
    stop()
    lastMessage.value = null
    attempts = 0
    if (enabled.value) connect()
  }, { immediate: true })

  if (import.meta.hot) import.meta.hot.dispose(() => { unwatch(); stop() })
})
