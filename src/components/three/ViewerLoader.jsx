import { useProgress } from '@react-three/drei';

/** Minimal loading overlay driven by three's loading manager (GLB + HDR progress). */
export default function ViewerLoader({ visible, label = 'Preparing your bicycle' }) {
  const { progress } = useProgress();
  const pct = Math.round(progress);
  return (
    <div className={`viewer-loader ${visible ? '' : 'is-hidden'}`} role="status" aria-live="polite" aria-hidden={!visible}>
      <div className="viewer-loader__inner">
        <span className="viewer-loader__label">{label}</span>
        <div className="viewer-loader__track" aria-hidden="true">
          <div className="viewer-loader__bar" style={{ transform: `scaleX(${Math.max(pct, 3) / 100})` }} />
        </div>
        <span className="viewer-loader__pct">{pct}%</span>
      </div>
    </div>
  );
}
