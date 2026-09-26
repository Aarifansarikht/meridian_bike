import { BIKE_LIST } from '../../config/bikes.js';
import Logo from '../common/Logo.jsx';

/** Includes the attribution required by the models' CC-BY-4.0 licences. */
export default function Footer() {
  return (
    <footer id="credits" className="footer">
      <div className="footer__brand">
        <Logo />
        <p>Bicycles configured in real time. Prices shown are estimates.</p>
      </div>
      <div className="footer__credits">
        <h2 className="footer__title">3D model credits</h2>
        <ul>
          {BIKE_LIST.map((b) => (
            <li key={b.id}>
              “{b.credit.title}” by {b.credit.author} —{' '}
              <a href={b.credit.url} target="_blank" rel="noopener noreferrer">
                Sketchfab
              </a>
              , licensed{' '}
              <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">
                CC BY 4.0
              </a>
              . Shown as <em>{b.name}</em>.
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
