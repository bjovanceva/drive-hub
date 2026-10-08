import { BlockList, isIP } from 'node:net'
import type { IncomingHttpHeaders } from 'node:http'

const cache = new Map<string, BlockList>()

function addresses(cidrs: string) {
  let list = cache.get(cidrs)
  if (list) return list
  list = new BlockList()
  for (const entry of cidrs.split(',').map(value => value.trim()).filter(Boolean)) {
    const [address = '', prefix, extra] = entry.split('/')
    const version = isIP(address)
    if (!version || extra !== undefined) throw new Error('Invalid TRUSTED_PROXY_CIDRS entry')
    const type = version === 4 ? 'ipv4' : 'ipv6'
    if (prefix === undefined) list.addAddress(address, type)
    else {
      const bits = Number(prefix)
      if (!/^\d+$/.test(prefix) || bits <= 0 || bits > (version === 4 ? 32 : 128)) throw new Error('Invalid TRUSTED_PROXY_CIDRS prefix')
      list.addSubnet(address, bits, type)
    }
  }
  cache.set(cidrs, list)
  return list
}

export function isTrustedProxy(address: string | undefined, cidrs: string) {
  const list = addresses(cidrs)
  if (!address) return false
  const normalized = address.startsWith('::ffff:') ? address.slice(7) : address
  const version = isIP(normalized)
  return !!version && list.check(normalized, version === 4 ? 'ipv4' : 'ipv6')
}

/** Only the actual trusted socket peer may supply a forwarded scheme or IP. */
export function normalizeProxyHeaders(headers: IncomingHttpHeaders, peer: string | undefined, cidrs: string) {
  delete headers.forwarded
  delete headers['x-forwarded-host'] // Nginx must preserve the original Host.
  delete headers['x-real-ip']
  if (!isTrustedProxy(peer, cidrs)) {
    delete headers['x-forwarded-for']
    delete headers['x-forwarded-proto']
    return
  }
  if (!['http', 'https'].includes(String(headers['x-forwarded-proto']))) delete headers['x-forwarded-proto']
  const chain = String(headers['x-forwarded-for'] || '').split(',').map(value => value.trim())
  if (chain.some(address => !isIP(address))) {
    delete headers['x-forwarded-for']
    return
  }
  // Walk from Nginx towards the client; discard client-supplied spoofed entries.
  const client = chain.reverse().find(address => !isTrustedProxy(address, cidrs))
  if (client) headers['x-forwarded-for'] = client
  else delete headers['x-forwarded-for']
}
