import { mascotMain } from '../../assets/mascot'
import { Brand } from '../Brand'
import { GoogleIcon } from './GoogleIcon'

export function LoginView({ onSignIn, signingIn, error }) {
  return (
    <div className="layout layout-auth">
      <div className="page page-auth">
        <header className="hero">
          <img src={mascotMain} alt="" className="mascot mascot-welcome" />
          <Brand />
          <h1>당신의 사주를 읽어 드립니다</h1>
          <p className="lede">Google 계정으로 로그인하면 사주 기록을 저장하고 다시 볼 수 있습니다.</p>
        </header>

        <main className="main">
          <button
            type="button"
            className="google-signin"
            data-analytics="login"
            onClick={() => onSignIn()}
            disabled={signingIn}
          >
            <span className="google-signin-icon" aria-hidden="true">
              <GoogleIcon />
            </span>
            <span>{signingIn ? '로그인 중' : 'Google로 로그인'}</span>
            {signingIn && <span className="submit-dots" aria-hidden="true" />}
          </button>
          <button
            type="button"
            className="google-signin-switch"
            data-analytics="login_switch_account"
            onClick={() => onSignIn({ switchAccount: true })}
            disabled={signingIn}
          >
            다른 계정으로 로그인
          </button>
          {error && <p className="error">{error}</p>}
        </main>
      </div>
    </div>
  )
}
