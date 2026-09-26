import { CAMERA_PRESETS } from '../../three/cameraUtils.js';
import { useConfiguratorActions, useHistoryState } from '../../hooks/useBikeConfiguration.js';
import Icon from '../common/Icon.jsx';

const ORDER = ['threeQuarter', 'side', 'front', 'rear', 'top'];

export default function CameraPresets({ active, onSelect, showHistory }) {
  const { undo, redo, reset } = useConfiguratorActions();
  const { canUndo, canRedo } = useHistoryState();
  return (
    <div className="camera-presets glass" role="toolbar" aria-label="Camera views">
      {ORDER.map((id) => (
        <button key={id} type="button" className="camera-presets__btn" aria-pressed={active === id} onClick={() => onSelect(id)}>
          {CAMERA_PRESETS[id].label}
        </button>
      ))}
      {showHistory && (
        <>
          <span className="camera-presets__sep" aria-hidden="true" />
          <button type="button" className="camera-presets__btn" onClick={undo} disabled={!canUndo} aria-label="Undo">
            <Icon name="undo" size={16} />
          </button>
          <button type="button" className="camera-presets__btn" onClick={redo} disabled={!canRedo} aria-label="Redo">
            <Icon name="redo" size={16} />
          </button>
          <button type="button" className="camera-presets__btn" onClick={reset} aria-label="Reset to factory">
            <Icon name="reset" size={16} />
          </button>
        </>
      )}
    </div>
  );
}
