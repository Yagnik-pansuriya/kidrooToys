import { lazy, Suspense, useEffect, useState } from 'react';
import { isEngaged, whenEngaged } from '../../utils/whenEngaged';

// three.js is heavy — load it in its own chunk only once the visitor engages,
// so it never delays the first screen
const LazyCanvas = lazy(() => import('./AnimalCanvas'));
const LazySpot = lazy(() => import('./AnimalSpot'));

const useEngaged = () => {
  const [engaged, setEngaged] = useState(isEngaged);
  useEffect(() => (engaged ? undefined : whenEngaged(() => setEngaged(true))), [engaged]);
  return engaged;
};

export const AnimalCanvas = () => {
  const engaged = useEngaged();
  if (!engaged) return null;
  return (
    <Suspense fallback={null}>
      <LazyCanvas />
    </Suspense>
  );
};

export const AnimalSpot = (props) => {
  const engaged = useEngaged();
  if (!engaged) return null;
  return (
    <Suspense fallback={null}>
      <LazySpot {...props} />
    </Suspense>
  );
};

export { ANIMALS, shuffleAnimals } from './animals';
export { callAnimal, callRandomAnimal } from './animalBus';
