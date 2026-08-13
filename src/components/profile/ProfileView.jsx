import { useState } from 'react'
import { emptyProfile, isProfileComplete } from '../../lib/profile'
import { ProfileFields } from './ProfileFields'

export function ProfileView({ profile, onCancel, onSave, saving, error }) {
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
        <button
          type="submit"
          className="submit"
          data-analytics="save_profile"
          disabled={saving || !isProfileComplete(form)}
        >
          <span>{saving ? '저장 중' : '프로필 저장'}</span>
          {saving && <span className="submit-dots" aria-hidden="true" />}
        </button>
      </form>
    </article>
  )
}
