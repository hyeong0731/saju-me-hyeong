import { mascotThink } from '../../assets/mascot'
import { formatReadingDate } from '../../lib/readings'
import { isSupabaseConfigured } from '../../lib/supabase'

export function ReadingSidebar({ readings, selectedReadingId, onSelect }) {
  return (
    <aside className="sidebar" aria-label="저장된 사주">
      <p className="sidebar-label">Saved</p>
      <h2 className="sidebar-title">기록</h2>
      {readings.length === 0 ? (
        <div className="sidebar-empty-wrap">
          <img src={mascotThink} alt="" className="mascot mascot-empty" />
          <p className="sidebar-empty">
            {isSupabaseConfigured
              ? '아직 저장된 해석이 없습니다.'
              : 'Supabase 환경변수가 없어 기록을 불러올 수 없습니다.'}
          </p>
        </div>
      ) : (
        <ul className="reading-list">
          {readings.map((reading) => (
            <li key={reading.id}>
              <button
                type="button"
                className={`reading-item ${selectedReadingId === reading.id ? 'is-active' : ''}`}
                data-analytics="select_reading"
                onClick={() => onSelect(reading)}
              >
                {formatReadingDate(reading.created_at)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
