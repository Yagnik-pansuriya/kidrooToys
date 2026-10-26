import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { View } from '@react-three/drei';
import { FiVolume2, FiVolumeX } from 'react-icons/fi';
import { MUTE_EVENT, getMuted, playPopSound, setMuted } from '../../utils/animalSounds';
import './AnimalWorld.scss';

/**
 * One transparent WebGL canvas fixed over the page. Every <AnimalSpot />
 * draws its animal into this canvas at its own position (drei <View />),
 * so six animals cost one WebGL context instead of six.
 */
const AnimalCanvas = () => {
  const [muted, setMutedState] = useState(getMuted);

  useEffect(() => {
    const onChange = (e) => setMutedState(Boolean(e.detail));
    window.addEventListener(MUTE_EVENT, onChange);
    return () => window.removeEventListener(MUTE_EVENT, onChange);
  }, []);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    if (!next) playPopSound();
  };

  return (
    <>
      <Canvas
        className="animal-world-canvas"
        style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      >
        <View.Port />
      </Canvas>

      <button
        type="button"
        className={`animal-sound-toggle ${muted ? 'is-muted' : ''}`}
        onClick={toggleMute}
        aria-pressed={!muted}
        title={muted ? 'Turn animal sounds on' : 'Turn animal sounds off'}
      >
        {muted ? <FiVolumeX /> : <FiVolume2 />}
        <span>{muted ? 'Sounds off' : 'Animal sounds'}</span>
      </button>
    </>
  );
};

export default AnimalCanvas;
