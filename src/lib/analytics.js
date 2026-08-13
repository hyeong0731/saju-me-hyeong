export const GA_MEASUREMENT_ID = 'G-7155BN35C6'

let lastPageKey = ''

function gtag(...args) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag(...args)
}

export function trackEvent(name, params = {}) {
  gtag('event', name, params)
}

export function trackPageView(path, title) {
  const key = `${path}|${title}`
  if (!path || key === lastPageKey) return
  lastPageKey = key

  gtag('event', 'page_view', {
    page_title: title,
    page_path: path,
    page_location: `${window.location.origin}${path}`,
  })
}

export function getAnalyticsScreen({
  shareStatus,
  authReady,
  user,
  isEditingProfile,
  showResultPanel,
  isEditing,
  showOnboarding,
  supabaseConfigured,
}) {
  if (shareStatus === 'loading') {
    return { path: '/share/loading', title: '공유 사주 불러오는 중' }
  }
  if (shareStatus === 'not_found') {
    return { path: '/share/not-found', title: '공유 링크 없음' }
  }
  if (shareStatus === 'ready') {
    return { path: '/share', title: '공유된 사주' }
  }
  if (supabaseConfigured && !authReady) return null
  if (supabaseConfigured && !user) {
    return { path: '/login', title: '로그인' }
  }
  if (showOnboarding) {
    return { path: '/onboarding', title: '생시 정보 입력' }
  }
  if (isEditingProfile) {
    return { path: '/profile', title: '프로필' }
  }
  if (showResultPanel && isEditing) {
    return { path: '/result/edit', title: '해석 수정' }
  }
  if (showResultPanel) {
    return { path: '/result', title: '사주 해석' }
  }
  return { path: '/', title: '사주 보기' }
}

export function trackLogin(params = {}) {
  trackEvent('login', { method: 'google', ...params })
}

export function trackLogout() {
  trackEvent('logout')
}

export function trackGenerateReading(status) {
  trackEvent('generate_reading', { status })
}

export function trackSelectReading() {
  trackEvent('select_content', { content_type: 'saved_reading' })
}

export function trackShare(method) {
  trackEvent('share', { method, content_type: 'saju_reading' })
}

export function trackDeleteReading() {
  trackEvent('delete_reading')
}

export function trackEditReading() {
  trackEvent('edit_reading')
}

export function trackSaveReading() {
  trackEvent('save_reading')
}

export function trackOpenProfile() {
  trackEvent('open_profile')
}

export function trackSaveProfile(isOnboarding) {
  trackEvent(isOnboarding ? 'complete_onboarding' : 'save_profile')
}

export function trackShareCta(loggedIn) {
  trackEvent('click_share_cta', { logged_in: loggedIn })
}
