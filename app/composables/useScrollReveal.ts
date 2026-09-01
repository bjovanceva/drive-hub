type ScrollRevealOptions = {
  threshold?: number
  rootMargin?: string
}

/**
 * Reveals one element the first time it enters the viewport.
 * Consumers bind `target` to their root node and use the two state flags to
 * avoid hiding server-rendered content before client-side motion is ready.
 */
export function useScrollReveal(options: ScrollRevealOptions = {}) {
  const target = ref<HTMLElement | null>(null)
  const isMotionReady = ref(false)
  const isRevealed = ref(false)
  let observer: IntersectionObserver | undefined
  let readinessFrame: number | undefined

  onMounted(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      isMotionReady.value = true
      isRevealed.value = true
      return
    }

    observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) {
        return
      }

      isRevealed.value = true
      observer?.disconnect()
    }, {
      threshold: options.threshold ?? 0.18,
      rootMargin: options.rootMargin ?? '0px 0px -5% 0px'
    })

    if (target.value) {
      observer.observe(target.value)
    }

    // Waiting one frame ensures the browser paints the initial animation state
    // before the visible class is applied.
    readinessFrame = window.requestAnimationFrame(() => {
      isMotionReady.value = true
    })
  })

  onBeforeUnmount(() => {
    observer?.disconnect()

    if (readinessFrame !== undefined) {
      window.cancelAnimationFrame(readinessFrame)
    }
  })

  return {
    target,
    isMotionReady,
    isRevealed
  }
}
