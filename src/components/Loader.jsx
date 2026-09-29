import { useProgress } from '@react-three/drei';

/** Shows download progress while a model or HDR is loading. */
export default function Loader() {
  const { active, progress } = useProgress();
  if (!active) return null;

  return (
    <div className="loader" role="status">
      <span>Loading {Math.round(progress)}%</span>
      <div className="loader__bar">
        <div style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
