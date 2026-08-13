import { Brand } from '../Brand'
import { ResultView } from '../reading/ResultView'
import { ShareInvite, SharePromoBar } from './ShareInvite'

export function SharedReadingPage({ reading, text, user, onExit }) {
  return (
    <div className="layout layout-auth">
      <div className="page page-auth">
        <header className="hero hero-compact">
          <Brand withFace />
        </header>
        {!user && <SharePromoBar />}
        <ResultView reading={reading} text={text} isShared />
        <ShareInvite user={user} onExit={onExit} />
      </div>
    </div>
  )
}
