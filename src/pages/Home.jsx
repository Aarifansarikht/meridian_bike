import { useEffect } from 'react';
import LandingNavbar from '../components/landing/LandingNavbar.jsx';
import Hero from '../components/landing/Hero.jsx';
import BikeShowcase from '../components/landing/BikeShowcase.jsx';
import Process from '../components/landing/Process.jsx';
import Footer from '../components/landing/Footer.jsx';

export default function Home() {
  useEffect(() => {
    document.title = 'Meridian — Bicycle Configurator';
  }, []);
  return (
    <div className="landing">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <LandingNavbar />
      <main id="main">
        <Hero />
        <BikeShowcase />
        <Process />
      </main>
      <Footer />
    </div>
  );
}
