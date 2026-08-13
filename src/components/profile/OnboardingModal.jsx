import { useState } from 'react'
import { mascotThink } from '../../assets/mascot'
import { emptyProfile, isProfileComplete } from '../../lib/profile'
import { ProfileFields } from './ProfileFields'

export function OnboardingModal({ initialName, onSave, saving, error }) {
  const [form, setForm] = useState(() => emptyProfile({ name: initialName ?? '' }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isProfileComplete(form)) return
    await onSave(form)
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        <img src={mascotThink} alt="" className="mascot mascot-modal" />
        <p className="modal-kicker">Welcome</p>
        <h2 id="onboarding-title" className="modal-title">
          생시 정보를 알려 주세요
        </h2>
        <p className="modal-lede">
          처음 한 번만 입력하면, 다음부터는 저장된 정보로 사주를 봅니다.
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <ProfileFields form={form} setForm={setForm} idPrefix="onboarding" />
          {error && <p className="error">{error}</p>}
          <button
            type="submit"
            className="submit"
            data-analytics="complete_onboarding"
            disabled={saving || !isProfileComplete(form)}
          >
            <span>{saving ? '저장 중' : '저장하고 시작하기'}</span>
            {saving && <span className="submit-dots" aria-hidden="true" />}
          </button>
        </form>
      </div>
    </div>
  )
}
