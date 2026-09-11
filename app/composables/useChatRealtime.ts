import type { ChatMessage } from './useChat'

export function useChatRealtime() {
  return {
    status: useState<'offline' | 'connecting' | 'connected'>('chat-status', () => 'offline'),
    revision: useState('chat-revision', () => 0),
    lastMessage: useState<ChatMessage | null>('chat-last-message', () => null)
  }
}
