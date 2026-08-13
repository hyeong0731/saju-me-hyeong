import { useEffect, useState } from 'react'

export const READING_WAIT_PHRASES = [
  '사주 명식을 펼치는 중',
  '오행의 무게를 헤아리는 중',
  '숨은 기질을 들여다보는 중',
  '앞으로 흐를 운을 살피는 중',
]

export function useRotatingPhrase(phrases, active, intervalMs = 2400) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!active) {
      setIndex(0)
      return undefined
    }

    const timeoutId = window.setInterval(() => {
      setIndex((current) => (current + 1) % phrases.length)
    }, intervalMs)

    return () => window.clearInterval(timeoutId)
  }, [active, phrases, intervalMs])

  return phrases[index] ?? ''
}
