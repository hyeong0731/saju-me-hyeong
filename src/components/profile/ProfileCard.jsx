export function ProfileCard({ name, meta, onEdit }) {
  return (
    <section className="profile-card" aria-label="내 생시 정보">
      <p className="profile-card-kicker">Profile</p>
      <h2 className="profile-card-name">{name}</h2>
      {meta && <p className="profile-card-meta">{meta}</p>}
      <button type="button" className="profile-card-edit" data-analytics="open_profile" onClick={onEdit}>
        프로필 수정
      </button>
    </section>
  )
}
