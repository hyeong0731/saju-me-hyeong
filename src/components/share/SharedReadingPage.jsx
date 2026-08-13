import { Brand } from '../Brand'
import { ResultView } from '../reading/ResultView'

export function SharedReadingPage({ reading, text, user, onExit }) {
  return (
    <div className="layout layout-auth">
      <div className="page page-auth">
        <header className="hero hero-compact">
          <Brand withFace />
        </header>
        <ResultView reading={reading} text={text} isShared />
        <div className="share-cta">
          <p className="share-cta-lede">
            {user
              ? '내 사주 기록으로 돌아가려면 아래 버튼을 눌러 주세요.'
              : '내 사주도 궁금하다면 로그인하고 해석을 받아 보세요.'}
          </p>
          <button type="button" className="submit" data-analytics="click_share_cta" onClick={onExit}>
            {user ? '내 사주로 돌아가기' : '내 사주 보러 가기'}
          </button>
        </div>
      </div>
    </div>
  )
}
