import { useState, useEffect } from 'react'
import Nav from './components/Nav'
import PageHead from './components/PageHead'
import HomePage from './components/HomePage'
import TherapistProfile from './components/TherapistProfile'
import TherapistSignUp from './components/TherapistSignUp'
import Footer from './components/Footer'
import LiveChat from './components/LiveChat'
import BlockedScreen from './components/BlockedScreen'
import TopLoader from './components/TopLoader'
import { getStoredTherapists } from './data/therapists'
import { BLOCKED_VISITOR_IDS } from './data/blocklist'

function getRouteFromHash() {
  const hash = window.location.hash.replace('#/', '').replace('#', '')
  return hash || 'home'
}

function App() {
  const [currentRoute, setCurrentRoute] = useState(getRouteFromHash)
  const [therapistsList, setTherapistsList] = useState(getStoredTherapists)
  const [isPageLoading, setIsPageLoading] = useState(false)

  const refreshTherapists = () => {
    setTherapistsList(getStoredTherapists())
  }

  // Block check
  const visitorId = typeof localStorage !== 'undefined' ? localStorage.getItem('_vid') : null
  const isBlocked =
    visitorId &&
    BLOCKED_VISITOR_IDS.map((id) => id.toUpperCase()).includes(visitorId.toUpperCase())

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentRoute(getRouteFromHash())
      refreshTherapists()
    }
    window.addEventListener('hashchange', handleHashChange)

    // Global Anti-Download and Anti-Right-Click Protection
    const handleContextMenu = (e) => {
      e.preventDefault()
    }
    const handleKeyDown = (e) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 's' || e.key === 'S' || e.key === 'u' || e.key === 'U' || e.key === 'p' || e.key === 'P')
      ) {
        e.preventDefault()
      }
    }
    const handleDragStart = (e) => {
      if (e.target.tagName === 'IMG') {
        e.preventDefault()
      }
    }

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('dragstart', handleDragStart)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('dragstart', handleDragStart)
    }
  }, [])

  // Smoothly dismiss the luxury initial splash screen
  useEffect(() => {
    const splash = document.getElementById('splash-preloader')
    if (splash) {
      const timer = setTimeout(() => {
        splash.classList.add('splash-fade-out')
        setTimeout(() => {
          splash.style.display = 'none'
        }, 700)
      }, 1100)
      return () => clearTimeout(timer)
    }
  }, [])

  if (isBlocked) {
    return <BlockedScreen />
  }

  const navigateTo = (route) => {
    if (route !== currentRoute) {
      setIsPageLoading(true)
      setTimeout(() => {
        setIsPageLoading(false)
      }, 350)
    }
    window.location.hash = `#/${route === 'home' ? '' : route}`
    setCurrentRoute(route)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cleanRoute = currentRoute.toLowerCase()
  const isSignUpPage = cleanRoute === 'therapist-signup' || cleanRoute === 'join' || cleanRoute === 'register'

  const selectedTherapist = therapistsList.find(
    (t) =>
      t.id.toLowerCase() === cleanRoute ||
      t.slug.toLowerCase() === cleanRoute ||
      t.accessCode?.toLowerCase() === cleanRoute
  )

  return (
    <>
      <TopLoader isLoading={isPageLoading} />
      <Nav
        isIndividualPage={Boolean(selectedTherapist && currentRoute !== 'home')}
        onNavigate={navigateTo}
      />

      {isSignUpPage ? (
        <TherapistSignUp
          onComplete={(slug) => {
            refreshTherapists()
            navigateTo(slug)
          }}
          onBack={() => navigateTo('home')}
        />
      ) : currentRoute === 'home' || !selectedTherapist ? (
        <>
          <PageHead />
          <HomePage onSelectTherapist={navigateTo} onJoinProvider={() => navigateTo('therapist-signup')} />
        </>
      ) : (
        <TherapistProfile therapist={selectedTherapist} onBack={() => navigateTo('home')} />
      )}

      <Footer />
      <LiveChat currentPage={selectedTherapist ? selectedTherapist.name : isSignUpPage ? 'Provider Sign Up' : 'Home'} />
    </>
  )
}

export default App
