declare global {
  interface Window { gtag?: (...args: unknown[]) => void }
}

export function track(event: string, params?: Record<string, string | number | boolean>) {
  if (typeof window !== 'undefined') window.gtag?.('event', event, params)
}
