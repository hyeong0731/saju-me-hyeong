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

export function stripMarkdown(text) {
  if (!text) return ''
  return String(text)
    .replace(/\r\n/g, '\n')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s{0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`{1,3}([^`]+)`{1,3}/g, '$1')
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/(^|[\s(（])\*([^*\n]+?)\*(?=[\s.,!?。，、)）]|$)/g, '$1$2')
    .replace(/(^|[\s(（])_([^_\n]+?)_(?=[\s.,!?。，、)）]|$)/g, '$1$2')
    .replace(/^\s{0,3}[-*+]\s+/gm, '')
    .replace(/^\s{0,3}\d+[.)]\s+/gm, '')
    .replace(/[*#]{1,6}/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function isClosingQuestion(paragraph) {
  const trimmed = paragraph.trim()
  if (!trimmed) return true

  const asksFollowUp =
    /(궁금|더 알고|알려\s*드|다음에|무엇이|어떤 점|어떤 부분|질문|연애운도|재물운도|직업운도)/.test(
      trimmed,
    ) && /[?？]/.test(trimmed)

  if (asksFollowUp) return true

  const sentences = trimmed
    .split(/(?<=[.。!！?？])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)

  return sentences.length > 0 && sentences.every((sentence) => /[?？]\s*$/.test(sentence))
}

export function stripTrailingQuestions(text) {
  if (!text) return ''
  const parts = String(text)
    .trim()
    .split(/\n\s*\n/)

  while (parts.length > 1 && isClosingQuestion(parts[parts.length - 1])) {
    parts.pop()
  }

  return parts.join('\n\n').trim()
}

export function formatReadingText(text) {
  return stripTrailingQuestions(stripMarkdown(localizeReadingGender(text)))
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
