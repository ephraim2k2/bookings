import { useState, useEffect } from 'react'
import Nav from './components/Nav'
import PageHead from './components/PageHead'
import HomePage from './components/HomePage'
import TherapistProfile from './components/TherapistProfile'
import Footer from './components/Footer'
import WhatsAppBtn from './components/WhatsAppBtn'
import { therapists } from './data/therapists'

function getRouteFromHash() {
  const hash = window.location.hash.replace('#/', '').replace('#', '')
  return hash || 'home'
}

function App() {
  const [currentRoute, setCurrentRoute] = useState(getRouteFromHash)

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentRoute(getRouteFromHash())
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

  const navigateTo = (route) => {
    window.location.hash = `#/${route === 'home' ? '' : route}`
    setCurrentRoute(route)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const selectedTherapist = therapists.find((t) => t.id === currentRoute)

  return (
    <>
      <Nav currentRoute={currentRoute} onNavigate={navigateTo} />

      {currentRoute === 'home' || !selectedTherapist ? (
        <>
          <PageHead />
          <HomePage onSelectTherapist={navigateTo} />
        </>
      ) : (
        <TherapistProfile therapist={selectedTherapist} onBack={() => navigateTo('home')} />
      )}

      <Footer />
      <WhatsAppBtn className="whatsapp-float" label="Contact support on WhatsApp" />
    </>
  )
}

export default App
