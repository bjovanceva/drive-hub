/** Keeps section links active on child pages and hash links on their section. */
export function isNavigationActive(
  route: { path: string, hash: string },
  target: { path: string, hash: string }
) {
  const targetPath = target.path.replace(/\/$/, '') || '/'
  const currentPath = route.path.replace(/\/$/, '') || '/'
  const matchesPath = currentPath === targetPath
    || (targetPath !== '/' && currentPath.startsWith(`${targetPath}/`))

  return matchesPath && (!target.hash || route.hash === target.hash)
}
