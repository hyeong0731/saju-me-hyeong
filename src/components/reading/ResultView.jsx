import { formatBirthMeta } from '../../lib/profile'
import { formatReadingText } from '../../lib/readings'
import { supabase } from '../../lib/supabase'

export function ResultView({
  reading,
  text,
  onClose,
  onEdit,
  onDelete,
  deleting,
  onShare,
  sharing,
  shareMessage,
  isShared = false,
}) {
  const paragraphs = formatReadingText(text)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
  const titleName = reading?.name
  const meta = formatBirthMeta(reading)
  const canManage = Boolean(!isShared && reading?.id && supabase)
  const canShare = Boolean(canManage && onShare)

  return (
    <article className="result">
      <div className="result-header">
        <p className="result-kicker">{isShared ? 'Shared' : 'Interpretation'}</p>
        <div className="result-actions">
          {canShare && (
            <button
              type="button"
              className="result-action"
              data-analytics="share"
              onClick={onShare}
              disabled={sharing}
            >
              {sharing ? '공유 준비 중' : '공유하기'}
            </button>
          )}
          {canManage && (
            <>
              <button
                type="button"
                className="result-action"
                data-analytics="edit_reading"
                onClick={onEdit}
              >
                수정
              </button>
              <button
                type="button"
                className="result-action result-action-danger"
                data-analytics="delete_reading"
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
      {shareMessage && <p className="share-toast">{shareMessage}</p>}
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
