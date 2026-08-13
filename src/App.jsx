import { useEffect } from 'react'
import {
  AuthBar,
  HomePanel,
  LoginView,
  OnboardingModal,
  ProfileView,
  ReadingSidebar,
  ResultPanel,
  SharedReadingPage,
  SharedStatusPage,
} from './components'
import { useSajuApp } from './hooks/useSajuApp'
import { getAnalyticsScreen, trackPageView } from './lib/analytics'
import { isSupabaseConfigured } from './lib/supabase'
import './styles/index.css'

function App() {
  const {
    user,
    authReady,
    signingIn,
    signingOut,
    profile,
    loading,
    saving,
    deleting,
    error,
    result,
    readings,
    selectedReading,
    isEditing,
    isEditingProfile,
    hasProfile,
    shareStatus,
    sharing,
    shareMessage,
    showResultPanel,
    showOnboarding,
    profileMeta,
    signInWithGoogle,
    signOut,
    handleSaveProfile,
    handleSubmit,
    handleSelectReading,
    handleCloseResult,
    handleStartEdit,
    handleOpenProfile,
    handleCancelProfile,
    handleCancelEdit,
    handleSaveEdit,
    handleExitShare,
    handleShare,
    handleDeleteReading,
  } = useSajuApp()

  useEffect(() => {
    const screen = getAnalyticsScreen({
      shareStatus,
      authReady,
      user,
      isEditingProfile,
      showResultPanel,
      isEditing,
      showOnboarding,
      supabaseConfigured: isSupabaseConfigured,
    })
    if (screen) trackPageView(screen.path, screen.title)
  }, [
    shareStatus,
    authReady,
    user,
    isEditingProfile,
    showResultPanel,
    isEditing,
    showOnboarding,
  ])

  if (shareStatus === 'loading' || shareStatus === 'not_found') {
    return <SharedStatusPage status={shareStatus} onExit={handleExitShare} />
  }

  if (shareStatus === 'ready') {
    if (!selectedReading || !result) {
      return <SharedStatusPage status="not_found" onExit={handleExitShare} />
    }

    return (
      <SharedReadingPage
        reading={selectedReading}
        text={result}
        user={user}
        onExit={handleExitShare}
      />
    )
  }

  if (isSupabaseConfigured && (!authReady || !user)) {
    return <LoginView onSignIn={signInWithGoogle} signingIn={signingIn} error={error} />
  }

  return (
    <div className="layout">
      <ReadingSidebar
        readings={readings}
        selectedReadingId={selectedReading?.id}
        onSelect={handleSelectReading}
      />

      <div className="page">
        {user && (
          <AuthBar
            user={user}
            profileName={profile.name}
            onOpenProfile={hasProfile ? handleOpenProfile : undefined}
            onSignOut={signOut}
            signingOut={signingOut}
          />
        )}
        {isEditingProfile ? (
          <ProfileView
            key={`${profile.name}-${profile.birthDate}-${profile.birthTime}`}
            profile={profile}
            onCancel={handleCancelProfile}
            onSave={handleSaveProfile}
            saving={saving}
            error={error}
          />
        ) : showResultPanel ? (
          <ResultPanel
            isEditing={isEditing}
            selectedReading={selectedReading}
            result={result}
            error={error}
            deleting={deleting}
            sharing={sharing}
            shareMessage={shareMessage}
            onCancelEdit={handleCancelEdit}
            onSaveEdit={handleSaveEdit}
            saving={saving}
            onClose={handleCloseResult}
            onEdit={handleStartEdit}
            onDelete={handleDeleteReading}
            onShare={handleShare}
          />
        ) : (
          <HomePanel
            profile={profile}
            profileMeta={profileMeta}
            hasProfile={hasProfile}
            loading={loading}
            error={error}
            onEditProfile={handleOpenProfile}
            onSubmit={handleSubmit}
          />
        )}
      </div>

      {showOnboarding && (
        <OnboardingModal
          initialName={
            profile.name || user?.user_metadata?.full_name || user?.user_metadata?.name || ''
          }
          onSave={handleSaveProfile}
          saving={saving}
          error={error}
        />
      )}
    </div>
  )
}

export default App
