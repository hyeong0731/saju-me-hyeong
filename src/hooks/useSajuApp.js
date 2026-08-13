import { useEffect, useState } from 'react'
import { interpretSaju } from '../lib/gemini'
import {
  emptyProfile,
  formatBirthMeta,
  isProfileComplete,
  profileFromRow,
  profileToReadingSnapshot,
} from '../lib/profile'
import { flattenReading, READING_SELECT, USER_FIELDS } from '../lib/readings'
import {
  clearShareParamFromUrl,
  getShareTokenFromLocation,
  shareUrlForToken,
} from '../lib/share'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { getKoreanAge } from '../lib/age'
import {
  trackDeleteReading,
  trackEditReading,
  trackGenerateReading,
  trackLogin,
  trackLogout,
  trackOpenProfile,
  trackSaveProfile,
  trackSaveReading,
  trackSelectReading,
  trackShare,
  trackShareCta,
} from '../lib/analytics'
import { useAuth } from './useAuth'

export function useSajuApp() {
  const auth = useAuth()
  const { user } = auth

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
  const [hasProfile, setHasProfile] = useState(false)
  const [profileChecked, setProfileChecked] = useState(!isSupabaseConfigured)
  const [shareStatus, setShareStatus] = useState(() =>
    getShareTokenFromLocation() ? 'loading' : 'idle',
  )
  const [sharing, setSharing] = useState(false)
  const [shareMessage, setShareMessage] = useState('')

  useEffect(() => {
    if (auth.callbackError) setError(auth.callbackError)
  }, [auth.callbackError])

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
    setError('')
    trackLogin()
    const message = await auth.signInWithGoogle()
    if (message) setError(message)
  }

  async function signOut() {
    setError('')
    const message = await auth.signOut()
    if (message) {
      setError(message)
      return
    }
    trackLogout()
    handleCloseResult()
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
    const snapshot = profileToReadingSnapshot(nextProfile)
    setReadings((prev) => prev.map((item) => ({ ...item, ...snapshot })))
    setSelectedReading((current) => (current ? { ...current, ...snapshot } : current))
  }

  async function handleSaveProfile(nextProfile) {
    if (!isProfileComplete(nextProfile)) {
      setError('이름, 생년월일, 태어난 시간, 성별을 모두 입력해 주세요.')
      return
    }

    const isOnboarding = !hasProfile
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
      trackSaveProfile(isOnboarding)
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
    trackGenerateReading('start')

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

      const snapshot = profileToReadingSnapshot(profile)

      if (!supabase) {
        setResult(text)
        setSelectedReading({ ...snapshot, result: text })
        trackGenerateReading('success')
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
      trackGenerateReading('success')
    } catch (err) {
      trackGenerateReading('error')
      setError(err.message || '사주 해석 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function handleSelectReading(reading) {
    trackSelectReading()
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
    trackEditReading()
    setIsEditing(true)
    setError('')
  }

  function handleOpenProfile() {
    trackOpenProfile()
    setIsEditingProfile(true)
    setIsEditing(false)
    setError('')
  }

  function handleCancelProfile() {
    setIsEditingProfile(false)
    setError('')
  }

  function handleCancelEdit() {
    setIsEditing(false)
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

      const reading = flattenReading(data, profileToReadingSnapshot(profile))
      setSelectedReading(reading)
      setResult(reading.result)
      setReadings((prev) => prev.map((item) => (item.id === reading.id ? reading : item)))
      setIsEditing(false)
      trackSaveReading()
    } catch (err) {
      setError(err.message || '수정 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  function handleExitShare() {
    trackShareCta(Boolean(user))
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
          trackShare('native')
          return
        } catch (err) {
          if (err?.name === 'AbortError') return
        }
      }

      try {
        await navigator.clipboard.writeText(url)
        setShareMessage('링크를 복사했어요. 친구에게 보내 주세요.')
        trackShare('clipboard')
      } catch {
        setShareMessage(url)
        trackShare('fallback')
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
      trackDeleteReading()
      handleCloseResult()
    } catch (err) {
      setError(err.message || '삭제 중 오류가 발생했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  return {
    ...auth,
    profile,
    loading,
    saving,
    deleting,
    error,
    result,
    readings,
    selectedReading,
    isEditing,
    isEditingProfile,
    hasProfile,
    profileChecked,
    shareStatus,
    sharing,
    shareMessage,
    showResultPanel: Boolean(result || isEditing),
    showOnboarding: Boolean(user && profileChecked && !hasProfile),
    profileMeta: formatBirthMeta(profileToReadingSnapshot(profile)),
    signInWithGoogle,
    signOut,
    handleSaveProfile,
    handleSubmit,
    handleSelectReading,
    handleCloseResult,
    handleStartEdit,
    handleOpenProfile,
    handleCancelProfile,
    handleCancelEdit,
    handleSaveEdit,
    handleExitShare,
    handleShare,
    handleDeleteReading,
  }
}
