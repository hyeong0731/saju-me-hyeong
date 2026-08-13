import { getKoreanAge } from './age'

export function emptyProfile(overrides = {}) {
  return {
    name: '',
    birthDate: '',
    birthTime: '',
    gender: '',
    calendarType: 'solar',
    ...overrides,
  }
}

export function isProfileComplete(profile) {
  return Boolean(
    profile?.name &&
      profile?.birthDate &&
      profile?.birthTime &&
      profile?.gender &&
      profile?.calendarType,
  )
}

export function profileFromRow(data) {
  return emptyProfile({
    name: data?.name ?? '',
    birthDate: data?.birth_date ?? '',
    birthTime: String(data?.birth_time ?? '').slice(0, 5),
    gender: data?.gender ?? '',
    calendarType: data?.calendar_type ?? 'solar',
  })
}

export function formatBirthMeta(reading) {
  if (!reading?.birth_date) return null

  const genderLabel = reading.gender === 'female' ? '여성' : '남성'
  const calendarLabel = reading.calendar_type === 'lunar' ? '음력' : '양력'
  const time = String(reading.birth_time ?? '').slice(0, 5)
  const parts = [reading.birth_date, time, genderLabel, calendarLabel]
  if (reading.age != null) parts.push(`${reading.age}세`)
  return parts.filter(Boolean).join(' · ')
}

export function profileToReadingSnapshot(profile) {
  return {
    name: profile.name,
    birth_date: profile.birthDate,
    birth_time: profile.birthTime,
    gender: profile.gender,
    calendar_type: profile.calendarType,
    age: profile.birthDate ? getKoreanAge(profile.birthDate) : null,
  }
}
