import { mascotAnalyze, mascotThink } from '../../assets/mascot'
import { Brand } from '../Brand'
import { ShareInvite } from './ShareInvite'

export function SharedStatusPage({ status, onExit }) {
  const isLoading = status === 'loading'

  return (
    <div className="layout layout-auth">
      <div className="page page-auth">
        <header className="hero">
          <img
            src={isLoading ? mascotAnalyze : mascotThink}
            alt=""
            className={`mascot ${isLoading ? 'mascot-loading' : 'mascot-welcome'}`}
          />
          <Brand />
          {isLoading ? (
            <p className="lede">공유된 사주를 불러오는 중</p>
          ) : (
            <>
              <h1>공유 링크를 찾을 수 없습니다</h1>
              <p className="lede">링크가 잘못되었거나 해석이 삭제되었을 수 있습니다.</p>
            </>
          )}
        </header>
        {!isLoading && <ShareInvite user={false} onExit={onExit} />}
      </div>
    </div>
  )
}
