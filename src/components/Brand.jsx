import { mascotSmile } from '../assets/mascot'

export function Brand({ withFace = false }) {
  return (
    <p className={`brand ${withFace ? 'brand-row' : ''}`}>
      {withFace && <img src={mascotSmile} alt="" className="mascot mascot-brand" />}
      saju-me
    </p>
  )
}
