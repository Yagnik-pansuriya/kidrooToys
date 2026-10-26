// ============================================================================
// KIDROO TOYS - Animal World roster
// 3D models: Quaternius "Ultimate Animated Animals" + "Easy Enemies" (CC0)
// Sounds: real CC0 / public-domain recordings (see public/sounds/animals/CREDITS.md)
// Animation names are matched by suffix, e.g. 'Idle' -> 'AnimalArmature|Idle'.
// ============================================================================

export const ANIMALS = [
  {
    id: 'dog',
    name: 'Dog',
    emoji: '🐶',
    call: 'Woof!',
    model: '/models/animals/dog.glb',
    sound: '/sounds/animals/dog.mp3',
    idles: ['Idle', 'Idle_2', 'Idle_2_HeadLow', 'Eating'],
    hover: 'Idle_2',
    click: 'Attack',
    walk: 'Walk',
    walkSpeed: 0.55,
  },
  {
    id: 'cow',
    name: 'Cow',
    emoji: '🐮',
    call: 'Moo!',
    model: '/models/animals/cow.glb',
    sound: '/sounds/animals/cow.mp3',
    idles: ['Idle', 'Eating', 'Idle_Headlow', 'Idle_2'],
    hover: 'Idle_2',
    click: 'Gallop_Jump',
    walk: 'Walk',
    walkSpeed: 0.4,
  },
  {
    id: 'horse',
    name: 'Horse',
    emoji: '🐴',
    call: 'Neigh!',
    model: '/models/animals/horse.glb',
    sound: '/sounds/animals/horse.mp3',
    idles: ['Idle', 'Idle_2', 'Eating', 'Idle_Headlow'],
    hover: 'Idle_2',
    click: 'Gallop_Jump',
    walk: 'Walk',
    walkSpeed: 0.5,
  },
  {
    id: 'frog',
    name: 'Frog',
    emoji: '🐸',
    call: 'Ribbit!',
    model: '/models/animals/frog.glb',
    sound: '/sounds/animals/frog.mp3',
    idles: ['Frog_Idle'],
    hover: 'Frog_Attack',
    click: 'Frog_Jump',
    walk: 'Frog_Jump',
    walkSpeed: 0.6,
  },
  {
    id: 'donkey',
    name: 'Donkey',
    emoji: '🫏',
    call: 'Hee-haw!',
    model: '/models/animals/donkey.glb',
    sound: '/sounds/animals/donkey.mp3',
    idles: ['Idle', 'Eating', 'Idle_2', 'Idle_Headlow'],
    hover: 'Idle_2',
    click: 'Attack_Kick',
    walk: 'Walk',
    walkSpeed: 0.4,
  },
  {
    id: 'wolf',
    name: 'Wolf',
    emoji: '🐺',
    call: 'Awoooo!',
    model: '/models/animals/wolf.glb',
    sound: '/sounds/animals/wolf.mp3',
    idles: ['Idle', 'Idle_2', 'Idle_2_HeadLow'],
    hover: 'Idle_2',
    click: 'Gallop_Jump',
    walk: 'Walk',
    walkSpeed: 0.55,
  },
];

export const getAnimal = (id) => ANIMALS.find((a) => a.id === id);

// Fisher–Yates shuffle so every page visit gets a different line-up
export const shuffleAnimals = () => {
  const list = [...ANIMALS];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
};
