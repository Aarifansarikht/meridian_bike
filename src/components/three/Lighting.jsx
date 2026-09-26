/**
 * Soft key / rim lights layered over the HDR for crisper product highlights.
 * `fallback` adds a stronger rig for when the HDR could not be loaded.
 */
export default function Lighting({ fallback = false }) {
  return (
    <>
      <ambientLight intensity={fallback ? 0.6 : 0.08} />
      <directionalLight position={[3, 5, 4]} intensity={fallback ? 2.2 : 0.9} />
      <directionalLight position={[-4, 3, -3]} intensity={fallback ? 1.2 : 0.55} color="#dfe8ff" />
      {fallback && <hemisphereLight args={['#ffffff', '#333333', 1]} />}
    </>
  );
}
