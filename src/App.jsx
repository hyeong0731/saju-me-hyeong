import { useEffect, useState } from 'react'
import { interpretSaju } from './gemini'
import { isSupabaseConfigured, supabase } from './supabase'
import './App.css'

const READING_FIELDS =
  'id, name, birth_date, birth_time, gender, calendar_type, age, result, created_at'

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

function toEditForm(reading) {
  return {
    name: reading.name ?? '',
    birthDate: reading.birth_date ?? '',
    birthTime: String(reading.birth_time ?? '').slice(0, 5),
    gender: reading.gender ?? '',
    calendarType: reading.calendar_type ?? 'solar',
    result: reading.result ?? '',
  }
}

function ResultView({ reading, text, onClose, onEdit, onDelete, deleting }) {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  const titleName = reading?.name
  const meta = formatBirthMeta(reading)
  const canManage = Boolean(reading?.id && supabase)

  return (
    <article className="result">
      <div className="result-header">
        <p className="result-kicker">Interpretation</p>
        <div className="result-actions">
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

function EditReadingForm({ reading, onCancel, onSave, saving, error }) {
  const [form, setForm] = useState(() => toEditForm(reading))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.birthDate || !form.birthTime || !form.gender || !form.result.trim()) {
      return
    }
    const age = getKoreanAge(form.birthDate)
    await onSave({ ...form, age })
  }

  return (
    <article className="result result-edit">
      <div className="result-header">
        <p className="result-kicker">Edit</p>
        <button type="button" className="result-close" onClick={onCancel}>
          취소
        </button>
      </div>
      <h2 className="result-title">기록 수정</h2>

      <form className="form form-edit" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="edit-name">이름</label>
          <input
            id="edit-name"
            type="text"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>

        <div className="row">
          <div className="field">
            <label htmlFor="edit-birthDate">생년월일</label>
            <input
              id="edit-birthDate"
              type="date"
              value={form.birthDate}
              onChange={(e) => setForm((prev) => ({ ...prev, birthDate: e.target.value }))}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="edit-birthTime">태어난 시간</label>
            <input
              id="edit-birthTime"
              type="time"
              value={form.birthTime}
              onChange={(e) => setForm((prev) => ({ ...prev, birthTime: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="field">
          <span className="field-label" id="edit-gender-label">성별</span>
          <div className="segment" role="group" aria-labelledby="edit-gender-label">
            <label className={`segment-option ${form.gender === 'male' ? 'is-active' : ''}`}>
              <input
                type="radio"
                name="edit-gender"
                value="male"
                checked={form.gender === 'male'}
                onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
              />
              남성
            </label>
            <label className={`segment-option ${form.gender === 'female' ? 'is-active' : ''}`}>
              <input
                type="radio"
                name="edit-gender"
                value="female"
                checked={form.gender === 'female'}
                onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
              />
              여성
            </label>
          </div>
        </div>

        <div className="field">
          <span className="field-label" id="edit-calendar-label">양력 / 음력</span>
          <div className="segment" role="group" aria-labelledby="edit-calendar-label">
            <label className={`segment-option ${form.calendarType === 'solar' ? 'is-active' : ''}`}>
              <input
                type="radio"
                name="edit-calendarType"
                value="solar"
                checked={form.calendarType === 'solar'}
                onChange={(e) => setForm((prev) => ({ ...prev, calendarType: e.target.value }))}
              />
              양력
            </label>
            <label className={`segment-option ${form.calendarType === 'lunar' ? 'is-active' : ''}`}>
              <input
                type="radio"
                name="edit-calendarType"
                value="lunar"
                checked={form.calendarType === 'lunar'}
                onChange={(e) => setForm((prev) => ({ ...prev, calendarType: e.target.value }))}
              />
              음력
            </label>
          </div>
        </div>

        <div className="field">
          <label htmlFor="edit-result">사주 해석</label>
          <textarea
            id="edit-result"
            className="field-textarea"
            value={form.result}
            onChange={(e) => setForm((prev) => ({ ...prev, result: e.target.value }))}
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

function App() {
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [gender, setGender] = useState('')
  const [calendarType, setCalendarType] = useState('solar')

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState('')
  const [readings, setReadings] = useState([])
  const [selectedReading, setSelectedReading] = useState(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    loadReadings()
  }, [])

  async function loadReadings() {
    if (!supabase) return

    const { data, error: fetchError } = await supabase
      .from('saju_readings')
      .select(READING_FIELDS)
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
    setIsEditing(false)
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
        setSelectedReading({
          name,
          birth_date: birthDate,
          birth_time: birthTime,
          gender,
          calendar_type: calendarType,
          age,
          result: text,
        })
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
        .select(READING_FIELDS)
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
    setIsEditing(false)
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

  async function handleSaveEdit(form) {
    if (!supabase || !selectedReading?.id) return

    setSaving(true)
    setError('')

    try {
      const { data, error: updateError } = await supabase
        .from('saju_readings')
        .update({
          name: form.name,
          birth_date: form.birthDate,
          birth_time: form.birthTime,
          gender: form.gender,
          calendar_type: form.calendarType,
          age: form.age,
          result: form.result.trim(),
        })
        .eq('id', selectedReading.id)
        .select(READING_FIELDS)
        .single()

      if (updateError) {
        throw new Error(updateError.message)
      }

      setSelectedReading(data)
      setResult(data.result)
      setReadings((prev) => prev.map((item) => (item.id === data.id ? data : item)))
      setIsEditing(false)
    } catch (err) {
      setError(err.message || '수정 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteReading() {
    if (!supabase || !selectedReading?.id) return
    if (!window.confirm(`${selectedReading.name} 기록을 삭제할까요?`)) return

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
        {showResultPanel ? (
          <div id="saju-result">
            <header className="hero hero-compact">
              <p className="brand">saju-me</p>
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
              />
            )}
            {!isEditing && error && <p className="error">{error}</p>}
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
