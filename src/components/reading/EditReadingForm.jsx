import { useState } from 'react'
import { localizeReadingGender } from '../../lib/readings'

export function EditReadingForm({ reading, onCancel, onSave, saving, error }) {
  const [resultText, setResultText] = useState(localizeReadingGender(reading.result ?? ''))

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

        <button type="submit" className="submit" data-analytics="save_reading" disabled={saving}>
          <span>{saving ? '저장 중' : '저장'}</span>
          {saving && <span className="submit-dots" aria-hidden="true" />}
        </button>
      </form>
    </article>
  )
}
