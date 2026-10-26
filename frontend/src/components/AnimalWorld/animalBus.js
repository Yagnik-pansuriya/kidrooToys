// Lightweight bridge so any button on the page can "call" an animal
// without importing three.js. Spots register themselves when mounted.

export const CALL_EVENT = 'kidroo:animal-call';

const mounted = new Set();

export const registerAnimalSpot = (id) => {
  mounted.add(id);
  return () => mounted.delete(id);
};

// Scrolls to the animal and makes it perform (sound + name + gesture)
export const callAnimal = (id) => {
  window.dispatchEvent(new CustomEvent(CALL_EVENT, { detail: { id } }));
};

export const callRandomAnimal = () => {
  const ids = [...mounted];
  if (!ids.length) return false;
  callAnimal(ids[Math.floor(Math.random() * ids.length)]);
  return true;
};
