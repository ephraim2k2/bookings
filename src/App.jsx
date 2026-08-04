import Nav from './components/Nav'
import PageHead from './components/PageHead'
import TherapistProfile from './components/TherapistProfile'
import Footer from './components/Footer'
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
    </>
  )
}

export default App
