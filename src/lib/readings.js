import { getKoreanAge } from './age'

export const USER_FIELDS = 'name, birth_date, birth_time, gender, calendar_type'
export const READING_SELECT =
  'id, result, created_at, user_id, share_token, users ( name, birth_date, birth_time, gender, calendar_type )'

export function flattenReading(row, fallback = {}) {
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

export function localizeReadingGender(text) {
  if (!text) return ''
  return String(text)
    .replace(/성별\s*:\s*male(?:\s*\(\s*남성\s*\))?/gi, '성별: 남')
    .replace(/성별\s*:\s*female(?:\s*\(\s*여성\s*\))?/gi, '성별: 여')
}

export function formatReadingDate(iso) {
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
