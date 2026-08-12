import { useState } from 'react'
import { interpretSaju } from './gemini'
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

function App() {
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [gender, setGender] = useState('')
  const [calendarType, setCalendarType] = useState('solar')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()

    if (!name || !birthDate || !birthTime || !gender) {
      setError('이름, 생년월일, 태어난 시간, 성별을 모두 입력해 주세요.')
      return
    }

    setError('')
    setResult('')
    setLoading(true)

    try {
      const text = await interpretSaju({
        name,
        birthDate,
        birthTime,
        gender,
        calendarType,
        age: getKoreanAge(birthDate),
      })
      setResult(text)
    } catch (err) {
      setError(err.message || '사주 해석 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
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

        {result && (
          <article className="result">
            <p className="result-kicker">Interpretation</p>
            <h2>사주 해석</h2>
            <p className="result-body">{result}</p>
          </article>
        )}
      </main>
    </div>
  )
}

export default App
