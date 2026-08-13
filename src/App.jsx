import { useEffect, useState } from 'react'
import { interpretSaju } from './gemini'
import { isSupabaseConfigured, supabase } from './supabase'
import mascotMain from './assets/mascot/main.png'
import mascotSmile from './assets/mascot/smile.png'
import mascotThink from './assets/mascot/think.png'
import mascotAnalyze from './assets/mascot/analyze.png'
import './App.css'

function Brand({ withFace = false }) {
  return (
    <p className={`brand ${withFace ? 'brand-row' : ''}`}>
      {withFace && <img src={mascotSmile} alt="" className="mascot mascot-brand" />}
      saju-me
    </p>
  )
}

const USER_FIELDS = 'name, birth_date, birth_time, gender, calendar_type'
const READING_SELECT =
  'id, result, created_at, user_id, share_token, users ( name, birth_date, birth_time, gender, calendar_type )'
const SHARE_TOKEN_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function getShareTokenFromLocation() {
  try {
    const token = new URLSearchParams(window.location.search).get('share')
    if (!token || !SHARE_TOKEN_RE.test(token)) return null
    return token
  } catch {
    return null
  }
}

function clearShareParamFromUrl() {
  const url = new URL(window.location.href)
  if (!url.searchParams.has('share')) return
  url.searchParams.delete('share')
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
}

function shareUrlForToken(token) {
  return `${window.location.origin}/?share=${token}`
}

function getKoreanAge(birthDate) {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1
  }
  return age
}

function flattenReading(row, fallback = {}) {
  const nested = row?.users
  const profile = nested && !Array.isArray(nested) ? nested : fallback
  const birthDate = profile.birth_date ?? fallback.birth_date ?? ''

  return {
    id: row?.id,
    result: row?.result ?? '',
    created_at: row?.created_at,
    user_id: row?.user_id,
    share_token: row?.share_token ?? fallback.share_token ?? null,
    name: profile.name ?? fallback.name ?? '',
    birth_date: birthDate,
    birth_time: profile.birth_time ?? fallback.birth_time ?? '',
    gender: profile.gender ?? fallback.gender ?? '',
    calendar_type: profile.calendar_type ?? fallback.calendar_type ?? 'solar',
    age: birthDate ? getKoreanAge(birthDate) : null,
  }
}

function formatBirthMeta(reading) {
  if (!reading?.birth_date) return null

  const genderLabel = reading.gender === 'female' ? '여성' : '남성'
  const calendarLabel = reading.calendar_type === 'lunar' ? '음력' : '양력'
  const time = String(reading.birth_time ?? '').slice(0, 5)
  const parts = [reading.birth_date, time, genderLabel, calendarLabel]
  if (reading.age != null) parts.push(`${reading.age}세`)
  return parts.filter(Boolean).join(' · ')
}

function formatReadingDate(iso) {
  if (!iso) return '해석'
  return new Date(iso).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function emptyProfile(overrides = {}) {
  return {
    name: '',
    birthDate: '',
    birthTime: '',
    gender: '',
    calendarType: 'solar',
    ...overrides,
  }
}

function isProfileComplete(profile) {
  return Boolean(
    profile?.name &&
      profile?.birthDate &&
      profile?.birthTime &&
      profile?.gender &&
      profile?.calendarType,
  )
}

function profileFromRow(data) {
  return emptyProfile({
    name: data?.name ?? '',
    birthDate: data?.birth_date ?? '',
    birthTime: String(data?.birth_time ?? '').slice(0, 5),
    gender: data?.gender ?? '',
    calendarType: data?.calendar_type ?? 'solar',
  })
}

function ProfileFields({ form, setForm, idPrefix }) {
  return (
    <>
      <div className="field">
        <label htmlFor={`${idPrefix}-name`}>이름</label>
        <input
          id={`${idPrefix}-name`}
          type="text"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="홍길동"
          autoComplete="name"
          required
        />
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor={`${idPrefix}-birthDate`}>생년월일</label>
          <input
            id={`${idPrefix}-birthDate`}
            type="date"
            value={form.birthDate}
            onChange={(e) => setForm((prev) => ({ ...prev, birthDate: e.target.value }))}
            required
          />
        </div>
        <div className="field">
          <label htmlFor={`${idPrefix}-birthTime`}>태어난 시간</label>
          <input
            id={`${idPrefix}-birthTime`}
            type="time"
            value={form.birthTime}
            onChange={(e) => setForm((prev) => ({ ...prev, birthTime: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="field">
        <span className="field-label" id={`${idPrefix}-gender-label`}>
          성별
        </span>
        <div className="segment" role="group" aria-labelledby={`${idPrefix}-gender-label`}>
          <label className={`segment-option ${form.gender === 'male' ? 'is-active' : ''}`}>
            <input
              type="radio"
              name={`${idPrefix}-gender`}
              value="male"
              checked={form.gender === 'male'}
              onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
            />
            남성
          </label>
          <label className={`segment-option ${form.gender === 'female' ? 'is-active' : ''}`}>
            <input
              type="radio"
              name={`${idPrefix}-gender`}
              value="female"
              checked={form.gender === 'female'}
              onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
            />
            여성
          </label>
        </div>
      </div>

      <div className="field">
        <span className="field-label" id={`${idPrefix}-calendar-label`}>
          양력 / 음력
        </span>
        <div className="segment" role="group" aria-labelledby={`${idPrefix}-calendar-label`}>
          <label className={`segment-option ${form.calendarType === 'solar' ? 'is-active' : ''}`}>
            <input
              type="radio"
              name={`${idPrefix}-calendarType`}
              value="solar"
              checked={form.calendarType === 'solar'}
              onChange={(e) => setForm((prev) => ({ ...prev, calendarType: e.target.value }))}
            />
            양력
          </label>
          <label className={`segment-option ${form.calendarType === 'lunar' ? 'is-active' : ''}`}>
            <input
              type="radio"
              name={`${idPrefix}-calendarType`}
              value="lunar"
              checked={form.calendarType === 'lunar'}
              onChange={(e) => setForm((prev) => ({ ...prev, calendarType: e.target.value }))}
            />
            음력
          </label>
        </div>
      </div>
    </>
  )
}

function OnboardingModal({ initialName, onSave, saving, error }) {
  const [form, setForm] = useState(() => emptyProfile({ name: initialName ?? '' }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isProfileComplete(form)) return
    await onSave(form)
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        <img src={mascotThink} alt="" className="mascot mascot-modal" />
        <p className="modal-kicker">Welcome</p>
        <h2 id="onboarding-title" className="modal-title">
          생시 정보를 알려 주세요
        </h2>
        <p className="modal-lede">
          처음 한 번만 입력하면, 다음부터는 저장된 정보로 사주를 봅니다.
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <ProfileFields form={form} setForm={setForm} idPrefix="onboarding" />
          {error && <p className="error">{error}</p>}
          <button type="submit" className="submit" disabled={saving || !isProfileComplete(form)}>
            <span>{saving ? '저장 중' : '저장하고 시작하기'}</span>
            {saving && <span className="submit-dots" aria-hidden="true" />}
          </button>
        </form>
      </div>
    </div>
  )
}

function ProfileView({ profile, onCancel, onSave, saving, error }) {
  const [form, setForm] = useState(() => emptyProfile(profile))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isProfileComplete(form)) return
    await onSave(form)
  }

  return (
    <article className="result result-edit">
      <div className="result-header">
        <p className="result-kicker">Profile</p>
        <button type="button" className="result-close" onClick={onCancel}>
          닫기
        </button>
      </div>
      <h2 className="result-title">내 정보</h2>
      <p className="result-meta">이름과 생시는 사주 해석에 쓰입니다.</p>

      <form className="form form-edit" onSubmit={handleSubmit}>
        <ProfileFields form={form} setForm={setForm} idPrefix="profile" />
        {error && <p className="error">{error}</p>}
        <button type="submit" className="submit" disabled={saving || !isProfileComplete(form)}>
          <span>{saving ? '저장 중' : '프로필 저장'}</span>
          {saving && <span className="submit-dots" aria-hidden="true" />}
        </button>
      </form>
    </article>
  )
}

function ResultView({
  reading,
  text,
  onClose,
  onEdit,
  onDelete,
  deleting,
  onShare,
  sharing,
  shareMessage,
  isShared = false,
}) {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  const titleName = reading?.name
  const meta = formatBirthMeta(reading)
  const canManage = Boolean(!isShared && reading?.id && supabase)
  const canShare = Boolean(canManage && onShare)

  return (
    <article className="result">
      <div className="result-header">
        <p className="result-kicker">{isShared ? 'Shared' : 'Interpretation'}</p>
        <div className="result-actions">
          {canShare && (
            <button type="button" className="result-action" onClick={onShare} disabled={sharing}>
              {sharing ? '공유 준비 중' : '공유하기'}
            </button>
          )}
          {canManage && (
            <>
              <button type="button" className="result-action" onClick={onEdit}>
                수정
              </button>
              <button
                type="button"
                className="result-action result-action-danger"
                onClick={onDelete}
                disabled={deleting}
              >
                {deleting ? '삭제 중' : '삭제'}
              </button>
            </>
          )}
          {onClose && (
            <button type="button" className="result-close" onClick={onClose}>
              닫기
            </button>
          )}
        </div>
      </div>
      {shareMessage && <p className="share-toast">{shareMessage}</p>}
      <h2 className="result-title">{titleName || '사주 해석'}</h2>
      {meta && <p className="result-meta">{meta}</p>}
      <div className="result-divider" aria-hidden="true" />
      <div className="result-body">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className={index === 0 ? 'result-lead' : undefined}>
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  )
}

function SharedStatusPage({ status, onExit }) {
  const isLoading = status === 'loading'

  return (
    <div className="layout layout-auth">
      <div className="page page-auth">
        <header className="hero">
          <img
            src={isLoading ? mascotAnalyze : mascotThink}
            alt=""
            className={`mascot ${isLoading ? 'mascot-loading' : 'mascot-welcome'}`}
          />
          <Brand />
          {isLoading ? (
            <p className="lede">공유된 사주를 불러오는 중</p>
          ) : (
            <>
              <h1>공유 링크를 찾을 수 없습니다</h1>
              <p className="lede">링크가 잘못되었거나 해석이 삭제되었을 수 있습니다.</p>
            </>
          )}
        </header>
        {!isLoading && (
          <main className="main">
            <button type="button" className="submit" onClick={onExit}>
              내 사주 보러 가기
            </button>
          </main>
        )}
      </div>
    </div>
  )
}

function SharedReadingPage({ reading, text, user, onExit }) {
  return (
    <div className="layout layout-auth">
      <div className="page page-auth">
        <header className="hero hero-compact">
          <Brand withFace />
        </header>
        <ResultView reading={reading} text={text} isShared />
        <div className="share-cta">
          <p className="share-cta-lede">
            {user
              ? '내 사주 기록으로 돌아가려면 아래 버튼을 눌러 주세요.'
              : '내 사주도 궁금하다면 로그인하고 해석을 받아 보세요.'}
          </p>
          <button type="button" className="submit" onClick={onExit}>
            {user ? '내 사주로 돌아가기' : '내 사주 보러 가기'}
          </button>
        </div>
      </div>
    </div>
  )
}

function EditReadingForm({ reading, onCancel, onSave, saving, error }) {
  const [resultText, setResultText] = useState(reading.result ?? '')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!resultText.trim()) return
    await onSave(resultText.trim())
  }

  return (
    <article className="result result-edit">
      <div className="result-header">
        <p className="result-kicker">Edit</p>
        <button type="button" className="result-close" onClick={onCancel}>
          취소
        </button>
      </div>
      <h2 className="result-title">해석 수정</h2>

      <form className="form form-edit" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="edit-result">사주 해석</label>
          <textarea
            id="edit-result"
            className="field-textarea"
            value={resultText}
            onChange={(e) => setResultText(e.target.value)}
            rows={8}
            required
          />
        </div>

        {error && <p className="error">{error}</p>}

        <button type="submit" className="submit" disabled={saving}>
          <span>{saving ? '저장 중' : '저장'}</span>
          {saving && <span className="submit-dots" aria-hidden="true" />}
        </button>
      </form>
    </article>
  )
}

function LoginView({ onSignIn, signingIn, error }) {
  return (
    <div className="layout layout-auth">
      <div className="page page-auth">
        <header className="hero">
          <img src={mascotMain} alt="" className="mascot mascot-welcome" />
          <Brand />
          <h1>당신의 사주를 읽어 드립니다</h1>
          <p className="lede">Google 계정으로 로그인하면 사주 기록을 저장하고 다시 볼 수 있습니다.</p>
        </header>

        <main className="main">
          <button type="button" className="google-signin" onClick={onSignIn} disabled={signingIn}>
            <span className="google-signin-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.59 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
            </span>
            <span>{signingIn ? '로그인 중' : 'Google로 로그인'}</span>
            {signingIn && <span className="submit-dots" aria-hidden="true" />}
          </button>
          {error && <p className="error">{error}</p>}
        </main>
      </div>
    </div>
  )
}

function AuthBar({ user, profileName, onOpenProfile, onSignOut, signingOut }) {
  const label = profileName || user.user_metadata?.full_name || user.email || '사용자'

  return (
    <div className="auth-bar">
      <span className="auth-user">{label}</span>
      <div className="auth-actions">
        {onOpenProfile && (
          <button type="button" className="auth-signout" onClick={onOpenProfile}>
            프로필
          </button>
        )}
        <button type="button" className="auth-signout" onClick={onSignOut} disabled={signingOut}>
          {signingOut ? '로그아웃 중' : '로그아웃'}
        </button>
      </div>
    </div>
  )
}

function App() {
  const [profile, setProfile] = useState(emptyProfile())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState('')
  const [readings, setReadings] = useState([])
  const [selectedReading, setSelectedReading] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)

  const [user, setUser] = useState(null)
  const [hasProfile, setHasProfile] = useState(false)
  const [profileChecked, setProfileChecked] = useState(!isSupabaseConfigured)
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured)
  const [signingIn, setSigningIn] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [shareStatus, setShareStatus] = useState(() =>
    getShareTokenFromLocation() ? 'loading' : 'idle',
  )
  const [sharing, setSharing] = useState(false)
  const [shareMessage, setShareMessage] = useState('')

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const authError = params.get('error') || hashParams.get('error')
      const authErrorDescription =
        params.get('error_description') || hashParams.get('error_description')

      if (authError) {
        setError(
          decodeURIComponent(authErrorDescription || authError).replace(/\+/g, ' '),
        )
      }
    } catch {
      // ignore malformed callback URLs
    }
  }, [])

  useEffect(() => {
    if (!supabase) return undefined

    let cancelled = false

    function applySession(session) {
      if (cancelled) return
      setUser(session?.user ?? null)
      setAuthReady(true)
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => applySession(session))
      .catch(() => applySession(null))

    const timeoutId = window.setTimeout(() => {
      if (!cancelled) setAuthReady(true)
    }, 4000)

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session)
    })

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (user) {
      loadUserData(user)
      return
    }

    setReadings([])
    setHasProfile(false)
    setProfileChecked(false)
    setProfile(emptyProfile())
    setIsEditingProfile(false)
  }, [user])

  useEffect(() => {
    const shouldLock = Boolean(
      user && profileChecked && !hasProfile && shareStatus === 'idle',
    )
    if (!shouldLock) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [user, profileChecked, hasProfile, shareStatus])

  useEffect(() => {
    const token = getShareTokenFromLocation()
    if (!token) return undefined
    if (!supabase) {
      setShareStatus('not_found')
      return undefined
    }

    let cancelled = false
    setShareStatus('loading')

    supabase
      .rpc('get_shared_reading', { p_token: token })
      .then(({ data, error: fetchError }) => {
        if (cancelled) return
        const row = Array.isArray(data) ? data[0] : data
        if (fetchError || !row) {
          setShareStatus('not_found')
          return
        }

        const reading = flattenReading(row, row)
        setSelectedReading(reading)
        setResult(row.result ?? '')
        setIsEditing(false)
        setIsEditingProfile(false)
        setShareStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setShareStatus('not_found')
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!shareMessage) return undefined
    const timeoutId = window.setTimeout(() => setShareMessage(''), 5000)
    return () => window.clearTimeout(timeoutId)
  }, [shareMessage])

  async function signInWithGoogle() {
    if (!supabase) return

    setSigningIn(true)
    setError('')

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })

    if (signInError) {
      setError(signInError.message)
      setSigningIn(false)
    }
  }

  async function signOut() {
    if (!supabase) return

    setSigningOut(true)
    setError('')

    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      setError(signOutError.message)
    } else {
      handleCloseResult()
    }

    setSigningOut(false)
  }

  async function loadUserData(authUser) {
    await Promise.all([loadProfile(authUser), loadReadings()])
  }

  async function loadProfile(authUser) {
    if (!supabase) return

    const { data, error: fetchError } = await supabase
      .from('users')
      .select(USER_FIELDS)
      .eq('id', authUser.id)
      .maybeSingle()

    if (fetchError) {
      console.error(fetchError)
      setProfileChecked(true)
      return
    }

    if (!data?.name || !data.birth_date || !data.birth_time || !data.gender) {
      setHasProfile(false)
      setProfile(
        emptyProfile({
          name: data?.name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
        }),
      )
      setProfileChecked(true)
      return
    }

    const nextProfile = profileFromRow(data)
    setProfile(nextProfile)
    setHasProfile(isProfileComplete(nextProfile))
    setProfileChecked(true)
  }

  async function loadReadings() {
    if (!supabase) return

    const { data, error: fetchError } = await supabase
      .from('saju_readings')
      .select(READING_SELECT)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error(fetchError)
      return
    }

    setReadings((data ?? []).map((row) => flattenReading(row)))
  }

  async function upsertProfile(nextProfile) {
    const { error: upsertError } = await supabase.from('users').upsert({
      id: user.id,
      name: nextProfile.name,
      birth_date: nextProfile.birthDate,
      birth_time: nextProfile.birthTime,
      gender: nextProfile.gender,
      calendar_type: nextProfile.calendarType,
      updated_at: new Date().toISOString(),
    })

    if (upsertError) {
      throw new Error(upsertError.message)
    }

    setProfile(nextProfile)
    setHasProfile(true)
  }

  function applyProfileToReadings(nextProfile) {
    const snapshot = {
      name: nextProfile.name,
      birth_date: nextProfile.birthDate,
      birth_time: nextProfile.birthTime,
      gender: nextProfile.gender,
      calendar_type: nextProfile.calendarType,
    }
    setReadings((prev) =>
      prev.map((item) => ({
        ...item,
        ...snapshot,
        age: getKoreanAge(nextProfile.birthDate),
      })),
    )
    setSelectedReading((current) =>
      current
        ? { ...current, ...snapshot, age: getKoreanAge(nextProfile.birthDate) }
        : current,
    )
  }

  async function handleSaveProfile(nextProfile) {
    if (!isProfileComplete(nextProfile)) {
      setError('이름, 생년월일, 태어난 시간, 성별을 모두 입력해 주세요.')
      return
    }

    setSaving(true)
    setError('')

    try {
      if (supabase) {
        await upsertProfile(nextProfile)
      } else {
        setProfile(nextProfile)
        setHasProfile(true)
      }
      applyProfileToReadings(nextProfile)
      setIsEditingProfile(false)
    } catch (err) {
      setError(err.message || '프로필 저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!isProfileComplete(profile)) {
      setError('프로필 정보를 먼저 입력해 주세요.')
      return
    }

    setError('')
    setResult('')
    setSelectedReading(null)
    setIsEditing(false)
    setIsEditingProfile(false)
    setLoading(true)

    try {
      const age = getKoreanAge(profile.birthDate)
      const text = await interpretSaju({
        name: profile.name,
        birthDate: profile.birthDate,
        birthTime: profile.birthTime,
        gender: profile.gender,
        calendarType: profile.calendarType,
        age,
      })

      const snapshot = {
        name: profile.name,
        birth_date: profile.birthDate,
        birth_time: profile.birthTime,
        gender: profile.gender,
        calendar_type: profile.calendarType,
        age,
      }

      if (!supabase) {
        setResult(text)
        setSelectedReading({ ...snapshot, result: text })
        return
      }

      const { data, error: insertError } = await supabase
        .from('saju_readings')
        .insert({
          user_id: user.id,
          result: text,
        })
        .select(READING_SELECT)
        .single()

      if (insertError) {
        throw new Error(insertError.message)
      }

      const reading = flattenReading(data, snapshot)
      setResult(text)
      setSelectedReading(reading)
      setReadings((prev) => [reading, ...prev])
    } catch (err) {
      setError(err.message || '사주 해석 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function handleSelectReading(reading) {
    setSelectedReading(reading)
    setResult(reading.result)
    setIsEditing(false)
    setIsEditingProfile(false)
    setError('')
    requestAnimationFrame(() => {
      document.getElementById('saju-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function handleCloseResult() {
    setSelectedReading(null)
    setResult('')
    setIsEditing(false)
    setError('')
  }

  function handleStartEdit() {
    if (!selectedReading?.id) return
    setIsEditing(true)
    setError('')
  }

  async function handleSaveEdit(resultText) {
    if (!supabase || !selectedReading?.id) return

    setSaving(true)
    setError('')

    try {
      const { data, error: updateError } = await supabase
        .from('saju_readings')
        .update({
          result: resultText,
        })
        .eq('id', selectedReading.id)
        .select(READING_SELECT)
        .single()

      if (updateError) {
        throw new Error(updateError.message)
      }

      const reading = flattenReading(data, {
        name: profile.name,
        birth_date: profile.birthDate,
        birth_time: profile.birthTime,
        gender: profile.gender,
        calendar_type: profile.calendarType,
      })
      setSelectedReading(reading)
      setResult(reading.result)
      setReadings((prev) => prev.map((item) => (item.id === reading.id ? reading : item)))
      setIsEditing(false)
    } catch (err) {
      setError(err.message || '수정 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  function handleExitShare() {
    clearShareParamFromUrl()
    setShareStatus('idle')
    setShareMessage('')
    handleCloseResult()
  }

  async function handleShare() {
    if (!supabase || !selectedReading?.id) return

    setSharing(true)
    setShareMessage('')
    setError('')

    try {
      const { data: token, error: shareError } = await supabase.rpc('ensure_share_token', {
        p_reading_id: selectedReading.id,
      })

      if (shareError || !token) {
        throw new Error(shareError?.message || '공유 링크를 만들지 못했습니다.')
      }

      setSelectedReading((prev) => (prev ? { ...prev, share_token: token } : prev))
      setReadings((prev) =>
        prev.map((item) => (item.id === selectedReading.id ? { ...item, share_token: token } : item)),
      )

      const url = shareUrlForToken(token)
      const title = selectedReading.name ? `${selectedReading.name}님의 사주` : '사주 해석'
      const text = selectedReading.name
        ? `${selectedReading.name}님의 사주 해석을 보냈어요.`
        : '사주 해석을 보냈어요.'

      if (typeof navigator.share === 'function') {
        try {
          await navigator.share({ title, text, url })
          return
        } catch (err) {
          if (err?.name === 'AbortError') return
        }
      }

      try {
        await navigator.clipboard.writeText(url)
        setShareMessage('링크를 복사했어요. 친구에게 보내 주세요.')
      } catch {
        setShareMessage(url)
      }
    } catch (err) {
      setError(err.message || '공유 중 오류가 발생했습니다.')
    } finally {
      setSharing(false)
    }
  }

  async function handleDeleteReading() {
    if (!supabase || !selectedReading?.id) return
    if (!window.confirm('이 해석 기록을 삭제할까요?')) return

    setDeleting(true)
    setError('')

    try {
      const { error: deleteError } = await supabase
        .from('saju_readings')
        .delete()
        .eq('id', selectedReading.id)

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      setReadings((prev) => prev.filter((item) => item.id !== selectedReading.id))
      handleCloseResult()
    } catch (err) {
      setError(err.message || '삭제 중 오류가 발생했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  const showResultPanel = result || isEditing
  const showOnboarding = Boolean(user && profileChecked && !hasProfile)
  const profileMeta = formatBirthMeta({
    name: profile.name,
    birth_date: profile.birthDate,
    birth_time: profile.birthTime,
    gender: profile.gender,
    calendar_type: profile.calendarType,
    age: profile.birthDate ? getKoreanAge(profile.birthDate) : null,
  })

  if (shareStatus === 'loading' || shareStatus === 'not_found') {
    return <SharedStatusPage status={shareStatus} onExit={handleExitShare} />
  }

  if (shareStatus === 'ready') {
    if (!selectedReading || !result) {
      return <SharedStatusPage status="not_found" onExit={handleExitShare} />
    }

    return (
      <SharedReadingPage
        reading={selectedReading}
        text={result}
        user={user}
        onExit={handleExitShare}
      />
    )
  }

  if (isSupabaseConfigured && (!authReady || !user)) {
    return <LoginView onSignIn={signInWithGoogle} signingIn={signingIn} error={error} />
  }

  return (
    <div className="layout">
      <aside className="sidebar" aria-label="저장된 사주">
        <p className="sidebar-label">Saved</p>
        <h2 className="sidebar-title">기록</h2>
        {readings.length === 0 ? (
          <div className="sidebar-empty-wrap">
            <img src={mascotThink} alt="" className="mascot mascot-empty" />
            <p className="sidebar-empty">
              {isSupabaseConfigured
                ? '아직 저장된 해석이 없습니다.'
                : 'Supabase 환경변수가 없어 기록을 불러올 수 없습니다.'}
            </p>
          </div>
        ) : (
          <ul className="reading-list">
            {readings.map((reading) => (
              <li key={reading.id}>
                <button
                  type="button"
                  className={`reading-item ${selectedReading?.id === reading.id ? 'is-active' : ''}`}
                  onClick={() => handleSelectReading(reading)}
                >
                  {formatReadingDate(reading.created_at)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <div className="page">
        {user && (
          <AuthBar
            user={user}
            profileName={profile.name}
            onOpenProfile={
              hasProfile
                ? () => {
                    setIsEditingProfile(true)
                    setIsEditing(false)
                    setError('')
                  }
                : undefined
            }
            onSignOut={signOut}
            signingOut={signingOut}
          />
        )}
        {isEditingProfile ? (
          <ProfileView
            key={`${profile.name}-${profile.birthDate}-${profile.birthTime}`}
            profile={profile}
            onCancel={() => {
              setIsEditingProfile(false)
              setError('')
            }}
            onSave={handleSaveProfile}
            saving={saving}
            error={error}
          />
        ) : showResultPanel ? (
          <div id="saju-result">
            <header className="hero hero-compact">
              <Brand withFace />
            </header>
            {isEditing && selectedReading ? (
              <EditReadingForm
                key={selectedReading.id}
                reading={selectedReading}
                onCancel={() => {
                  setIsEditing(false)
                  setError('')
                }}
                onSave={handleSaveEdit}
                saving={saving}
                error={error}
              />
            ) : (
              <ResultView
                key={selectedReading?.id ?? 'live'}
                reading={selectedReading}
                text={result}
                onClose={handleCloseResult}
                onEdit={handleStartEdit}
                onDelete={handleDeleteReading}
                deleting={deleting}
                onShare={handleShare}
                sharing={sharing}
                shareMessage={shareMessage}
              />
            )}
            {!isEditing && error && <p className="error">{error}</p>}
          </div>
        ) : (
          <>
            <header className="hero">
              <Brand withFace />
              <h1>{profile.name ? `${profile.name}님의 사주` : '당신의 사주를 읽어 드립니다'}</h1>
              <p className="lede">저장된 생시로 해석합니다. 정보가 바뀌면 프로필에서 수정해 주세요.</p>
            </header>

            <main className="main">
              {hasProfile && (
                <section className="profile-card" aria-label="내 생시 정보">
                  <p className="profile-card-kicker">Profile</p>
                  <h2 className="profile-card-name">{profile.name}</h2>
                  {profileMeta && <p className="profile-card-meta">{profileMeta}</p>}
                  <button
                    type="button"
                    className="profile-card-edit"
                    onClick={() => {
                      setIsEditingProfile(true)
                      setError('')
                    }}
                  >
                    프로필 수정
                  </button>
                </section>
              )}

              <form className="form" onSubmit={handleSubmit}>
                {loading && (
                  <div className="reading-wait" aria-hidden="true">
                    <img src={mascotAnalyze} alt="" className="mascot mascot-loading" />
                  </div>
                )}
                <button type="submit" className="submit" disabled={loading || !hasProfile}>
                  <span>{loading ? '해석 중' : '사주 보기'}</span>
                  {loading && <span className="submit-dots" aria-hidden="true" />}
                </button>
              </form>

              {error && <p className="error">{error}</p>}
            </main>
          </>
        )}
      </div>

      {showOnboarding && (
        <OnboardingModal
          initialName={
            profile.name || user?.user_metadata?.full_name || user?.user_metadata?.name || ''
          }
          onSave={handleSaveProfile}
          saving={saving}
          error={error}
        />
      )}
    </div>
  )
}

export default App
