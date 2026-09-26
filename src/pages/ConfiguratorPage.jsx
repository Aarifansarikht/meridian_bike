import { useCallback, useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DEFAULT_BIKE_ID, getBike } from '../config/bikes.js';
import { selectBikeId, selectPartStates, selectVisibleCategories } from '../store/selectors.js';
import { setUnavailableParts } from '../store/configuratorSlice.js';
import { useConfigurationUrlSync, useUndoRedoShortcuts } from '../hooks/useBikeConfiguration.js';
import { useResponsive } from '../hooks/useResponsive.js';
import { DEFAULT_PRESET } from '../three/cameraUtils.js';
import BikeViewer from '../components/three/BikeViewer.jsx';
import ConfiguratorHeader from '../components/configurator/ConfiguratorHeader.jsx';
import ConfigurationPanel from '../components/configurator/ConfigurationPanel.jsx';
import CameraPresets from '../components/configurator/CameraPresets.jsx';
import ConfigurationSummary from '../components/configurator/ConfigurationSummary.jsx';
import ShareConfiguration from '../components/configurator/ShareConfiguration.jsx';
import Dialog from '../components/common/Dialog.jsx';

function Configurator({ bike }) {
  const dispatch = useDispatch();
  const { isMobile } = useResponsive();
  useConfigurationUrlSync(bike.id);
  useUndoRedoShortcuts();

  const storeBikeId = useSelector(selectBikeId);
  const partStates = useSelector(selectPartStates);
  const categories = useSelector(selectVisibleCategories);

  const [activeCategory, setActiveCategory] = useState(bike.categories[0].id);
  const [camera, setCamera] = useState({ preset: DEFAULT_PRESET, nonce: 0 });
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [sheet, setSheet] = useState('peek');

  // New bike: back to the first category and the hero camera angle.
  useEffect(() => {
    setActiveCategory(bike.categories[0].id);
    setCamera({ preset: DEFAULT_PRESET, nonce: 0 });
    document.title = `Configure ${bike.name} — Meridian`;
  }, [bike]);

  const onReady = useCallback((runtime) => dispatch(setUnavailableParts(runtime.missingParts)), [dispatch]);

  const onCategoryChange = useCallback(
    (id) => {
      setActiveCategory(id);
      const focusPart = categories.find((c) => c.id === id)?.focus;
      setCamera((c) => (focusPart ? { focusPart, nonce: c.nonce + 1 } : { preset: DEFAULT_PRESET, nonce: c.nonce + 1 }));
    },
    [categories],
  );

  const onPreset = useCallback((preset) => setCamera((c) => ({ preset, nonce: c.nonce + 1 })), []);

  return (
    <div className={`configurator ${isMobile ? 'configurator--mobile' : ''} ${isMobile ? `sheet-${sheet}` : ''}`}>
      <div className="configurator__stage" aria-hidden="false">
        <BikeViewer
          bike={bike}
          partStates={storeBikeId === bike.id ? partStates : null}
          cameraRequest={camera}
          onReady={onReady}
        />
      </div>

      <ConfiguratorHeader bike={bike} onShare={() => setSummaryOpen(true)} isMobile={isMobile} />

      {!isMobile && (
        <div className="stage-title">
          <p className="eyebrow">{bike.category}</p>
          <h1 className="stage-title__name">{bike.name}</h1>
          <p className="stage-title__tagline">{bike.tagline}</p>
        </div>
      )}
      {isMobile && <h1 className="visually-hidden">Configure the {bike.name}</h1>}

      <CameraPresets active={camera.preset} onSelect={onPreset} showHistory={isMobile} />

      <ConfigurationPanel
        activeCategory={activeCategory}
        onCategoryChange={onCategoryChange}
        onReview={() => setSummaryOpen(true)}
        isMobile={isMobile}
        sheet={sheet}
        onSheetChange={setSheet}
      />

      <Dialog open={summaryOpen} onClose={() => setSummaryOpen(false)} labelledBy="summary-title" className="dialog--summary">
        <ConfigurationSummary />
        <ShareConfiguration />
      </Dialog>
    </div>
  );
}

export default function ConfiguratorPage() {
  const { bikeId } = useParams();
  const bike = getBike(bikeId);
  if (!bike) return <Navigate to={`/configurator/${DEFAULT_BIKE_ID}`} replace />;
  return <Configurator bike={bike} />;
}
