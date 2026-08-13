export function ProfileFields({ form, setForm, idPrefix }) {
  return (
    <>
      <div className="field">
        <label htmlFor={`${idPrefix}-name`}>이름</label>
        <input
          id={`${idPrefix}-name`}
          type="text"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="홍길동"
          autoComplete="name"
          required
        />
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor={`${idPrefix}-birthDate`}>생년월일</label>
          <input
            id={`${idPrefix}-birthDate`}
            type="date"
            value={form.birthDate}
            onChange={(e) => setForm((prev) => ({ ...prev, birthDate: e.target.value }))}
            required
          />
        </div>
        <div className="field">
          <label htmlFor={`${idPrefix}-birthTime`}>태어난 시간</label>
          <input
            id={`${idPrefix}-birthTime`}
            type="time"
            value={form.birthTime}
            onChange={(e) => setForm((prev) => ({ ...prev, birthTime: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="field">
        <span className="field-label" id={`${idPrefix}-gender-label`}>
          성별
        </span>
        <div className="segment" role="group" aria-labelledby={`${idPrefix}-gender-label`}>
          <label className={`segment-option ${form.gender === 'male' ? 'is-active' : ''}`}>
            <input
              type="radio"
              name={`${idPrefix}-gender`}
              value="male"
              checked={form.gender === 'male'}
              onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
            />
            남성
          </label>
          <label className={`segment-option ${form.gender === 'female' ? 'is-active' : ''}`}>
            <input
              type="radio"
              name={`${idPrefix}-gender`}
              value="female"
              checked={form.gender === 'female'}
              onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
            />
            여성
          </label>
        </div>
      </div>

      <div className="field">
        <span className="field-label" id={`${idPrefix}-calendar-label`}>
          양력 / 음력
        </span>
        <div className="segment" role="group" aria-labelledby={`${idPrefix}-calendar-label`}>
          <label className={`segment-option ${form.calendarType === 'solar' ? 'is-active' : ''}`}>
            <input
              type="radio"
              name={`${idPrefix}-calendarType`}
              value="solar"
              checked={form.calendarType === 'solar'}
              onChange={(e) => setForm((prev) => ({ ...prev, calendarType: e.target.value }))}
            />
            양력
          </label>
          <label className={`segment-option ${form.calendarType === 'lunar' ? 'is-active' : ''}`}>
            <input
              type="radio"
              name={`${idPrefix}-calendarType`}
              value="lunar"
              checked={form.calendarType === 'lunar'}
              onChange={(e) => setForm((prev) => ({ ...prev, calendarType: e.target.value }))}
            />
            음력
          </label>
        </div>
      </div>
    </>
  )
}
