import { mascotSmile } from '../../assets/mascot'
import { trackShareCta } from '../../lib/analytics'

const HOME_HREF = '/'

function siteHost() {
  try {
    return window.location.host
  } catch {
    return 'saju-me'
  }
}

function GuestHomeLink({ className, children }) {
  return (
    <a
      className={className}
      href={HOME_HREF}
      data-analytics="click_share_cta"
      onClick={() => trackShareCta(false)}
    >
      {children}
    </a>
  )
}

export function SharePromoBar() {
  return (
    <GuestHomeLink className="share-promo-bar">
      <span className="share-promo-bar-text">사주를 보고 싶다면 여기로</span>
      <span className="share-promo-bar-go">{siteHost()} →</span>
    </GuestHomeLink>
  )
}

export function ShareInvite({ user, onExit }) {
  if (user) {
    return (
      <div className="share-cta">
        <p className="share-cta-lede">내 사주 기록으로 돌아가려면 아래 버튼을 눌러 주세요.</p>
        <button type="button" className="submit" data-analytics="click_share_cta" onClick={onExit}>
          내 사주로 돌아가기
        </button>
      </div>
    )
  }

  return (
    <div className="share-cta share-cta-invite">
      <img src={mascotSmile} alt="" className="mascot mascot-brand" />
      <p className="share-cta-title">사주를 보고 싶다면 여기로</p>
      <p className="share-cta-lede">이름과 생시만 알려 주면, 바로 읽어 드립니다.</p>
      <GuestHomeLink className="submit">내 사주 보러 가기</GuestHomeLink>
      <GuestHomeLink className="share-cta-url">{siteHost()}</GuestHomeLink>
    </div>
  )
}
