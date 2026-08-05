import Nav from './components/Nav'
import PageHead from './components/PageHead'
import TherapistProfile from './components/TherapistProfile'
import Footer from './components/Footer'
import WhatsAppBtn from './components/WhatsAppBtn'
import { therapists } from './data/therapists'

function App() {
  return (
    <>
      <Nav />
      <PageHead />
      {therapists.map((therapist) => (
        <TherapistProfile key={therapist.id} therapist={therapist} />
      ))}
      <Footer />
      <WhatsAppBtn className="whatsapp-float" label="Contact support on WhatsApp" />
    </>
  )
}

export default App

