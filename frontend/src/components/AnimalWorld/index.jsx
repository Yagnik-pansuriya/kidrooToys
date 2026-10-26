import { lazy, Suspense } from 'react';

// three.js is heavy — load it in its own chunk after the page is interactive
const LazyCanvas = lazy(() => import('./AnimalCanvas'));
const LazySpot = lazy(() => import('./AnimalSpot'));

export const AnimalCanvas = () => (
  <Suspense fallback={null}>
    <LazyCanvas />
  </Suspense>
);

export const AnimalSpot = (props) => (
  <Suspense fallback={null}>
    <LazySpot {...props} />
  </Suspense>
);

export { ANIMALS, shuffleAnimals } from './animals';
export { callAnimal, callRandomAnimal } from './animalBus';
