import { Link } from 'react-router-dom';
import Logo from '../common/Logo.jsx';
import { DEFAULT_BIKE_ID } from '../../config/bikes.js';

export default function LandingNavbar() {
  return (
    <header className="landing-nav">
      <Logo />
      <nav aria-label="Primary" className="landing-nav__links">
        <a href="#models">Models</a>
        <a href="#process">How it works</a>
        <a href="#credits">Credits</a>
      </nav>
      <Link to={`/configurator/${DEFAULT_BIKE_ID}`} className="btn btn--light btn--sm">
        Configure
      </Link>
    </header>
  );
}
