export function AuthBar({ user, profileName, onOpenProfile, onSignOut, signingOut }) {
  const label = profileName || user.user_metadata?.full_name || user.email || '사용자'

  return (
    <div className="auth-bar">
      <span className="auth-user">{label}</span>
      <div className="auth-actions">
        {onOpenProfile && (
          <button
            type="button"
            className="auth-signout"
            data-analytics="open_profile"
            onClick={onOpenProfile}
          >
            프로필
          </button>
        )}
        <button
          type="button"
          className="auth-signout"
          data-analytics="logout"
          onClick={onSignOut}
          disabled={signingOut}
        >
          {signingOut ? '로그아웃 중' : '로그아웃'}
        </button>
      </div>
    </div>
  )
}
