'use client'

/**
 * LangSwitcher — shown on /it to let Italian users opt into the English site.
 * Sets a lang-pref=en cookie (12h) so the middleware stops redirecting them.
 */
export default function LangSwitcher() {
  function switchToEnglish() {
    document.cookie = 'lang-pref=en; path=/; max-age=' + 60 * 60 * 12
    window.location.href = '/'
  }

  return (
    <p className="mt-6 text-xs text-gray-600">
      Vuoi la versione inglese?{' '}
      <button
        onClick={switchToEnglish}
        className="text-gray-500 hover:text-gray-300 underline underline-offset-2 transition-colors"
      >
        Switch to English →
      </button>
    </p>
  )
}
