import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Stats from '../components/Stats'
import WhyActorHub from '../components/WhyActorHub'
import Solutions from '../components/Solutions'
import Clients from '../components/Clients'
import Testimonials from '../components/Testimonials'
import CtaBanner from '../components/CtaBanner'
import Footer from '../components/Footer'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />
      <Hero />
      <Stats />
      <WhyActorHub />
      <Solutions />
      <Clients />
      <Testimonials />
      <CtaBanner />
      <Footer />
    </div>
  )
}
