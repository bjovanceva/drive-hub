import { getRequestURL, createError } from 'h3'
import { normalizeProxyHeaders } from '../utils/proxyTrust'

/** Enforce trust in middleware: Nitro request-hook exceptions are non-blocking. */
export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  normalizeProxyHeaders(event.node.req.headers, event.node.req.socket.remoteAddress, config.trustedProxyCidrs)
  if (!config.appOrigin) return // Local development has no public-domain contract.
  const origin = new URL(config.appOrigin)
  if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) {
    throw createError({ statusCode: 503, statusMessage: 'Application origin is not configured correctly' })
  }
  if (config.session.cookie.secure !== (origin.protocol === 'https:')) {
    throw createError({ statusCode: 503, statusMessage: 'Session cookie settings do not match the application origin' })
  }
  // Local container health checks do not use the public Host header.
  const localHealth = event.path.split('?')[0] === '/api/health'
    && ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(event.node.req.socket.remoteAddress || '')
  if (!localHealth && getRequestURL(event, { xForwardedHost: false }).host !== origin.host) {
    throw createError({ statusCode: 421, statusMessage: 'Use the configured Drive Hub domain' })
  }
})
