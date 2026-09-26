import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Dialog from '../common/Dialog.jsx';
import BikeViewer from '../three/BikeViewer.jsx';
import Icon from '../common/Icon.jsx';
import { getDefaultConfiguration } from '../../config/bikes.js';
import { resolvePartStates } from '../../utils/resolvePartStates.js';
import { DEFAULT_PRESET } from '../../three/cameraUtils.js';

const CAMERA = { preset: DEFAULT_PRESET, nonce: 0 };

/** Factory-spec 3D preview reusing the configurator's BikeViewer (no duplicated 3D logic). */
export default function QuickLookDialog({ bike, onClose }) {
  const partStates = useMemo(() => resolvePartStates(bike, getDefaultConfiguration(bike)), [bike]);
  return (
    <Dialog open onClose={onClose} labelledBy="quicklook-title" className="dialog--quicklook">
      <div className="quicklook">
        <BikeViewer bike={bike} partStates={partStates} cameraRequest={CAMERA} autoRotate enablePan={false} className="quicklook__viewer" />
        <div className="quicklook__bar">
          <div>
            <p className="eyebrow">{bike.category}</p>
            <h2 id="quicklook-title" className="quicklook__name">
              {bike.name}
            </h2>
          </div>
          <Link to={`/configurator/${bike.id}`} className="btn btn--primary">
            Configure <Icon name="arrowRight" size={16} />
          </Link>
        </div>
      </div>
    </Dialog>
  );
}
