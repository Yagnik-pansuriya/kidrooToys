import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PerspectiveCamera, View } from '@react-three/drei';
import AnimalModel from './AnimalModel';
import { getAnimal } from './animals';
import { CALL_EVENT, registerAnimalSpot } from './animalBus';
import { playAnimalSound, preloadAnimalSound } from '../../utils/animalSounds';
import './AnimalWorld.scss';

const HINT_KEY = 'kidroo_animal_tapped';

const readHintSeen = () => {
  try {
    return sessionStorage.getItem(HINT_KEY) === '1';
  } catch {
    return false;
  }
};

const rand = (min, max) => min + Math.random() * (max - min);

/**
 * A 3D animal that lives at a random spot inside its parent section.
 * The parent must be position: relative (add the `has-animal` class).
 *
 * @param {string} animalId   one of ANIMALS ids
 * @param {'left'|'right'|'auto'} side  which edge of the section to live on
 * @param {[number, number]} top        vertical range (in % of the section) to pick from
 * @param {boolean} hint               show a "Tap me!" chip until the child taps once
 */
const AnimalSpot = ({ animalId, side = 'auto', top = [2, 10], hint = false }) => {
  const animal = getAnimal(animalId);
  const spotRef = useRef(null);
  const modelRef = useRef(null);
  const performCount = useRef(0);

  const [isNear, setIsNear] = useState(false);
  const [talking, setTalking] = useState(false);
  const [hintSeen, setHintSeen] = useState(readHintSeen);

  // Random position for this visit
  const layout = useMemo(() => {
    const edge = side === 'auto' ? (Math.random() < 0.5 ? 'left' : 'right') : side;
    return {
      edge,
      faceDir: edge === 'left' ? 1 : -1,
      style: {
        top: `${rand(top[0], top[1]).toFixed(1)}%`,
        [edge]: `${rand(0.5, 4).toFixed(1)}%`,
      },
    };
  }, [side, top]);

  // Only load the model & sound when the animal is about to scroll into view
  useEffect(() => {
    const el = spotRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNear(true);
          preloadAnimalSound(animalId);
          observer.disconnect();
        }
      },
      { rootMargin: '400px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animalId]);

  const perform = useCallback(() => {
    const ticket = ++performCount.current;
    modelRef.current?.perform();
    setTalking(true);
    if (!hintSeen) {
      setHintSeen(true);
      try {
        sessionStorage.setItem(HINT_KEY, '1');
      } catch {
        // ignore
      }
    }
    playAnimalSound(animalId).finally(() => {
      if (ticket === performCount.current) setTalking(false);
    });
  }, [animalId, hintSeen]);

  // Other buttons on the page can call this animal (see animalBus)
  useEffect(() => {
    const unregister = registerAnimalSpot(animalId);
    const onCall = (e) => {
      if (e.detail?.id !== animalId) return;
      setIsNear(true);
      spotRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(perform, 700);
    };
    window.addEventListener(CALL_EVENT, onCall);
    return () => {
      unregister();
      window.removeEventListener(CALL_EVENT, onCall);
    };
  }, [animalId, perform]);

  if (!animal) return null;

  return (
    <div
      ref={spotRef}
      className={`animal-spot animal-spot--${layout.edge} ${talking ? 'is-talking' : ''}`}
      style={layout.style}
    >
      {talking && (
        <div className="animal-spot__bubble" aria-live="polite">
          <span className="animal-spot__call">{animal.call}</span>
          <strong className="animal-spot__name">
            {animal.emoji} {animal.name}
          </strong>
        </div>
      )}

      {hint && !hintSeen && !talking && <span className="animal-spot__hint">Tap me!</span>}

      <View
        className="animal-spot__view"
        role="button"
        tabIndex={0}
        aria-label={`Play the ${animal.name} sound`}
        onClick={perform}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            perform();
          }
        }}
        onPointerEnter={() => modelRef.current?.hover(true)}
        onPointerLeave={() => modelRef.current?.hover(false)}
      >
        <PerspectiveCamera makeDefault fov={30} position={[0, 1, 4.6]} onUpdate={(c) => c.lookAt(0, 0.62, 0)} />
        <hemisphereLight args={['#fffaf0', '#d8c6a8', 2]} />
        <directionalLight position={[2.5, 4, 3]} intensity={2.8} />
        <directionalLight position={[-3, 2, -2]} intensity={0.6} color="#ffd9b0" />
        {isNear && (
          <Suspense fallback={null}>
            <AnimalModel ref={modelRef} animal={animal} faceDir={layout.faceDir} />
          </Suspense>
        )}
      </View>
    </div>
  );
};

export default AnimalSpot;
