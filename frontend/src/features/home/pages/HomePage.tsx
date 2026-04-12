import Navbar from '../components/Navbar'
import HeroSlider from '../components/HeroSlider'
import Stats from '../components/Stats'
import WhyActorHub from '../components/WhyActorHub'
import OrangeBanner from '../components/OrangeBanner'
import Solutions from '../components/Solutions'
import Clients from '../components/Clients'
import Testimonials from '../components/Testimonials'
import CtaBanner from '../components/CtaBanner'
import Footer from '../components/Footer'

/**
 * HomePage — ACTOR Hub landing page
 * Structure (fidèle au Figma node-ids 188:2, 188:1696, 188:1132, 188:2261, 188:2826) :
 *   Navbar → HeroSlider (5 slides auto 5s) → Stats → WhyActorHub
 *   → OrangeBanner → Solutions → Clients → Testimonials → CtaBanner → Footer
 */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      <Navbar />
      <main>
        <HeroSlider />
        <Stats />
        <WhyActorHub />
        <OrangeBanner />
        <Solutions />
        <Clients />
        <Testimonials />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  )
}
