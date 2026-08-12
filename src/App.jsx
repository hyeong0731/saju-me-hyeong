import { useEffect, useState } from 'react'
import { interpretSaju } from './gemini'
import { isSupabaseConfigured, supabase } from './supabase'
import './App.css'

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

function formatBirthMeta(reading) {
  if (!reading?.birth_date) return null

  const genderLabel = reading.gender === 'female' ? '여성' : '남성'
  const calendarLabel = reading.calendar_type === 'lunar' ? '음력' : '양력'
  const time = String(reading.birth_time ?? '').slice(0, 5)
  const parts = [reading.birth_date, time, genderLabel, calendarLabel]
  if (reading.age != null) parts.push(`${reading.age}세`)
  return parts.filter(Boolean).join(' · ')
}

function ResultView({ reading, text, onClose }) {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  const titleName = reading?.name
  const meta = formatBirthMeta(reading)

  return (
    <article className="result">
      <div className="result-header">
        <p className="result-kicker">Interpretation</p>
        {onClose && (
          <button type="button" className="result-close" onClick={onClose}>
            닫기
          </button>
        )}
      </div>
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

function App() {
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [gender, setGender] = useState('')
  const [calendarType, setCalendarType] = useState('solar')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState('')
  const [readings, setReadings] = useState([])
  const [selectedReading, setSelectedReading] = useState(null)

  useEffect(() => {
    loadReadings()
  }, [])

  async function loadReadings() {
    if (!supabase) return

    const { data, error: fetchError } = await supabase
      .from('saju_readings')
      .select('id, name, birth_date, birth_time, gender, calendar_type, age, result, created_at')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error(fetchError)
      return
    }

    setReadings(data ?? [])
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!name || !birthDate || !birthTime || !gender) {
      setError('이름, 생년월일, 태어난 시간, 성별을 모두 입력해 주세요.')
      return
    }

    setError('')
    setResult('')
    setSelectedReading(null)
    setLoading(true)

    try {
      const age = getKoreanAge(birthDate)
      const text = await interpretSaju({
        name,
        birthDate,
        birthTime,
        gender,
        calendarType,
        age,
      })

      if (!supabase) {
        setResult(text)
        setSelectedReading({ name, birth_date: birthDate, birth_time: birthTime, gender, calendar_type: calendarType, age, result: text })
        return
      }

      const { data, error: insertError } = await supabase
        .from('saju_readings')
        .insert({
          name,
          birth_date: birthDate,
          birth_time: birthTime,
          gender,
          calendar_type: calendarType,
          age,
          result: text,
        })
        .select('id, name, birth_date, birth_time, gender, calendar_type, age, result, created_at')
        .single()

      if (insertError) {
        throw new Error(insertError.message)
      }

      setResult(text)
      setSelectedReading(data)
      setReadings((prev) => [data, ...prev])
    } catch (err) {
      setError(err.message || '사주 해석 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function handleSelectReading(reading) {
    setSelectedReading(reading)
    setResult(reading.result)
    setError('')
    requestAnimationFrame(() => {
      document.getElementById('saju-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function handleCloseResult() {
    setSelectedReading(null)
    setResult('')
  }

  return (
    <div className="layout">
      <aside className="sidebar" aria-label="저장된 사주">
        <p className="sidebar-label">Saved</p>
        <h2 className="sidebar-title">기록</h2>
        {readings.length === 0 ? (
          <p className="sidebar-empty">
            {isSupabaseConfigured
              ? '아직 저장된 이름이 없습니다.'
              : 'Supabase 환경변수가 없어 기록을 불러올 수 없습니다.'}
          </p>
        ) : (
          <ul className="reading-list">
            {readings.map((reading) => (
              <li key={reading.id}>
                <button
                  type="button"
                  className={`reading-item ${selectedReading?.id === reading.id ? 'is-active' : ''}`}
                  onClick={() => handleSelectReading(reading)}
                >
                  {reading.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <div className="page">
        {result ? (
          <div id="saju-result">
            <header className="hero hero-compact">
              <p className="brand">saju-me</p>
            </header>
            <ResultView
              key={selectedReading?.id ?? 'live'}
              reading={selectedReading}
              text={result}
              onClose={handleCloseResult}
            />
          </div>
        ) : (
          <>
            <header className="hero">
              <p className="brand">saju-me</p>
              <h1>당신의 사주를 읽어 드립니다</h1>
              <p className="lede">이름과 생시만 알려 주세요. 차분하고 직설적인 해석을 전해 드립니다.</p>
            </header>

            <main className="main">
              <form className="form" onSubmit={handleSubmit}>
                <div className="field">
                  <label htmlFor="name">이름</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="홍길동"
                    autoComplete="name"
                  />
                </div>

                <div className="row">
                  <div className="field">
                    <label htmlFor="birthDate">생년월일</label>
                    <input
                      id="birthDate"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="birthTime">태어난 시간</label>
                    <input
                      id="birthTime"
                      type="time"
                      value={birthTime}
                      onChange={(e) => setBirthTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="field">
                  <span className="field-label" id="gender-label">
                    성별
                  </span>
                  <div className="segment" role="group" aria-labelledby="gender-label">
                    <label className={`segment-option ${gender === 'male' ? 'is-active' : ''}`}>
                      <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={gender === 'male'}
                        onChange={(e) => setGender(e.target.value)}
                      />
                      남성
                    </label>
                    <label className={`segment-option ${gender === 'female' ? 'is-active' : ''}`}>
                      <input
                        type="radio"
                        name="gender"
                        value="female"
                        checked={gender === 'female'}
                        onChange={(e) => setGender(e.target.value)}
                      />
                      여성
                    </label>
                  </div>
                </div>

                <div className="field">
                  <span className="field-label" id="calendar-label">
                    양력 / 음력
                  </span>
                  <div className="segment" role="group" aria-labelledby="calendar-label">
                    <label className={`segment-option ${calendarType === 'solar' ? 'is-active' : ''}`}>
                      <input
                        type="radio"
                        name="calendarType"
                        value="solar"
                        checked={calendarType === 'solar'}
                        onChange={(e) => setCalendarType(e.target.value)}
                      />
                      양력
                    </label>
                    <label className={`segment-option ${calendarType === 'lunar' ? 'is-active' : ''}`}>
                      <input
                        type="radio"
                        name="calendarType"
                        value="lunar"
                        checked={calendarType === 'lunar'}
                        onChange={(e) => setCalendarType(e.target.value)}
                      />
                      음력
                    </label>
                  </div>
                </div>

                <button type="submit" className="submit" disabled={loading}>
                  <span>{loading ? '해석 중' : '사주 보기'}</span>
                  {loading && <span className="submit-dots" aria-hidden="true" />}
                </button>
              </form>

              {error && <p className="error">{error}</p>}
            </main>
          </>
        )}
      </div>
    </div>
  )
}

export default App
