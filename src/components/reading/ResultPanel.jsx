import { Brand } from '../Brand'
import { EditReadingForm } from './EditReadingForm'
import { ResultView } from './ResultView'

export function ResultPanel({
  isEditing,
  selectedReading,
  result,
  error,
  deleting,
  sharing,
  shareMessage,
  onCancelEdit,
  onSaveEdit,
  saving,
  onClose,
  onEdit,
  onDelete,
  onShare,
}) {
  return (
    <div id="saju-result">
      <header className="hero hero-compact">
        <Brand withFace />
      </header>
      {isEditing && selectedReading ? (
        <EditReadingForm
          key={selectedReading.id}
          reading={selectedReading}
          onCancel={onCancelEdit}
          onSave={onSaveEdit}
          saving={saving}
          error={error}
        />
      ) : (
        <ResultView
          key={selectedReading?.id ?? 'live'}
          reading={selectedReading}
          text={result}
          onClose={onClose}
          onEdit={onEdit}
          onDelete={onDelete}
          deleting={deleting}
          onShare={onShare}
          sharing={sharing}
          shareMessage={shareMessage}
        />
      )}
      {!isEditing && error && <p className="error">{error}</p>}
    </div>
  )
}
