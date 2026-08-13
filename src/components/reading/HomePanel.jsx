import { mascotAnalyze } from '../../assets/mascot'
import { Brand } from '../Brand'
import { ProfileCard } from '../profile/ProfileCard'

export function HomePanel({
  profile,
  profileMeta,
  hasProfile,
  loading,
  error,
  onEditProfile,
  onSubmit,
}) {
  return (
    <>
      <header className="hero">
        <Brand withFace />
        <h1>{profile.name ? `${profile.name}님의 사주` : '당신의 사주를 읽어 드립니다'}</h1>
        <p className="lede">저장된 생시로 해석합니다. 정보가 바뀌면 프로필에서 수정해 주세요.</p>
      </header>

      <main className="main">
        {hasProfile && (
          <ProfileCard name={profile.name} meta={profileMeta} onEdit={onEditProfile} />
        )}

        <form className="form" onSubmit={onSubmit}>
          {loading && (
            <div className="reading-wait" aria-hidden="true">
              <img src={mascotAnalyze} alt="" className="mascot mascot-loading" />
            </div>
          )}
          <button
            type="submit"
            className="submit"
            data-analytics="generate_reading"
            disabled={loading || !hasProfile}
          >
            <span>{loading ? '해석 중' : '사주 보기'}</span>
            {loading && <span className="submit-dots" aria-hidden="true" />}
          </button>
        </form>

        {error && <p className="error">{error}</p>}
      </main>
    </>
  )
}
