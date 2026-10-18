import { useState, useRef, useEffect, useCallback } from 'react';
import {
  FiVolume2,
  FiVolumeX,
  FiMusic,
  FiHelpCircle,
  FiStar,
  FiRotateCw,
  FiCheckCircle,
  FiAward
} from 'react-icons/fi';
import {
  playAnimalSound,
  speakAnimalGreeting,
  playPopSound,
  setMuted,
  getMuted,
  getAudioContext
} from '../../utils/animalSounds';
import './AnimalSafari.scss';

// ─── Animal Data Definition ─────────────────────────────────────────────────
const ANIMALS = [
  {
    id: 'lion',
    type: 'lion',
    name: 'Leo the Lion',
    title: 'King of the Savanna',
    sound: 'ROAAAR!',
    icon: '🦁',
    habitat: 'safari',
    habitatLabel: 'Safari',
    color: '#FF7A00',
    bgGradient: 'linear-gradient(145deg, #FFE8D6 0%, #FFD6A5 100%)',
    borderColor: '#FF9E40',
    funFact: 'Lions can sleep up to 20 hours a day and still have mega energy to run!',
    svgArt: 'lion',
  },
  {
    id: 'elephant',
    type: 'elephant',
    name: 'Ellie the Elephant',
    title: 'Gentle Giant',
    sound: 'PAWOOOOO!',
    icon: '🐘',
    habitat: 'safari',
    habitatLabel: 'Safari',
    color: '#3B82F6',
    bgGradient: 'linear-gradient(145deg, #DBEAFE 0%, #BFDBFE 100%)',
    borderColor: '#60A5FA',
    funFact: 'An elephant trunk has over 40,000 muscles and can pick up a tiny peanut!',
    svgArt: 'elephant',
  },
  {
    id: 'monkey',
    type: 'monkey',
    name: 'Momo the Monkey',
    title: 'Playful Acrobat',
    sound: 'OOH-OOH AAH-AAH!',
    icon: '🐵',
    habitat: 'safari',
    habitatLabel: 'Safari',
    color: '#D97706',
    bgGradient: 'linear-gradient(145deg, #FEF3C7 0%, #FDE68A 100%)',
    borderColor: '#F59E0B',
    funFact: 'Monkeys love peeling bananas from the bottom — they say it is much easier!',
    svgArt: 'monkey',
  },
  {
    id: 'dog',
    type: 'dog',
    name: 'Buddy the Puppy',
    title: 'Loyal Best Friend',
    sound: 'WOOF! WOOF!',
    icon: '🐶',
    habitat: 'farm',
    habitatLabel: 'Farmyard',
    color: '#EA580C',
    bgGradient: 'linear-gradient(145deg, #FFEDD5 0%, #FED7AA 100%)',
    borderColor: '#FB923C',
    funFact: 'Puppies can sense your happy mood from across the whole room!',
    svgArt: 'dog',
  },
  {
    id: 'cat',
    type: 'cat',
    name: 'Luna the Kitty',
    title: 'Velvet Purr Master',
    sound: 'MEEE-OWWW!',
    icon: '🐱',
    habitat: 'farm',
    habitatLabel: 'Farmyard',
    color: '#EC4899',
    bgGradient: 'linear-gradient(145deg, #FCE7F3 0%, #FBCFE8 100%)',
    borderColor: '#F472B6',
    funFact: 'Cats purr when they are happy, relaxed, or listening to storybooks!',
    svgArt: 'cat',
  },
  {
    id: 'frog',
    type: 'frog',
    name: 'Froggo the Jumper',
    title: 'Lily Pad Champion',
    sound: 'RIBBIT! CROAK!',
    icon: '🐸',
    habitat: 'forest',
    habitatLabel: 'Forest',
    color: '#10B981',
    bgGradient: 'linear-gradient(145deg, #D1FAE5 0%, #A7F3D0 100%)',
    borderColor: '#34D399',
    funFact: 'Frogs can jump more than 20 times their body length in one giant leap!',
    svgArt: 'frog',
  },
  {
    id: 'duck',
    type: 'duck',
    name: 'Daffy the Duckling',
    title: 'Puddle Splasher',
    sound: 'QUACK! QUACK!',
    icon: '🦆',
    habitat: 'farm',
    habitatLabel: 'Farmyard',
    color: '#F59E0B',
    bgGradient: 'linear-gradient(145deg, #FEF9C3 0%, #FEF08A 100%)',
    borderColor: '#FBBF24',
    funFact: 'Duck feathers are completely waterproof, keeping them warm and cozy!',
    svgArt: 'duck',
  },
  {
    id: 'cow',
    type: 'cow',
    name: 'Daisy the Cow',
    title: 'Sweet Meadow Buddy',
    sound: 'MOOOOOOO!',
    icon: '🐮',
    habitat: 'farm',
    habitatLabel: 'Farmyard',
    color: '#6366F1',
    bgGradient: 'linear-gradient(145deg, #EEF2FF 0%, #E0E7FF 100%)',
    borderColor: '#818CF8',
    funFact: 'Cows have best friends and get super happy when they hang out together!',
    svgArt: 'cow',
  },
  {
    id: 'fox',
    type: 'fox',
    name: 'Finn the Red Fox',
    title: 'Clever Explorer',
    sound: 'YIP! YAP! YIP!',
    icon: '🦊',
    habitat: 'forest',
    habitatLabel: 'Forest',
    color: '#F97316',
    bgGradient: 'linear-gradient(145deg, #FFEDD5 0%, #FDBA74 100%)',
    borderColor: '#FB923C',
    funFact: 'Foxes use their big fluffy bushy tails like a warm blanket when they sleep!',
    svgArt: 'fox',
  },
  {
    id: 'panda',
    type: 'panda',
    name: 'Bao the Panda',
    title: 'Bamboo Snacker',
    sound: 'SQUEAK & CRUNCH!',
    icon: '🐼',
    habitat: 'forest',
    habitatLabel: 'Forest',
    color: '#1F2937',
    bgGradient: 'linear-gradient(145deg, #F3F4F6 0%, #E5E7EB 100%)',
    borderColor: '#9CA3AF',
    funFact: 'Pandas can eat bamboo for 12 hours a day and are expert tree climbers!',
    svgArt: 'panda',
  },
  {
    id: 'unicorn',
    type: 'unicorn',
    name: 'Sparkle the Unicorn',
    title: 'Dreamland Guardian',
    sound: 'NEIGHHH & CHIME!',
    icon: '🦄',
    habitat: 'magic',
    habitatLabel: 'Magical',
    color: '#8B5CF6',
    bgGradient: 'linear-gradient(145deg, #F3E8FF 0%, #DDD6FE 100%)',
    borderColor: '#A78BFA',
    funFact: 'Sparkle leaves a trail of rainbow stardust wherever children dream!',
    svgArt: 'unicorn',
  },
  {
    id: 'owl',
    type: 'owl',
    name: 'Barnaby the Wise Owl',
    title: 'Starlight Storyteller',
    sound: 'HOO! HOO-HOOO!',
    icon: '🦉',
    habitat: 'forest',
    habitatLabel: 'Forest',
    color: '#0D9488',
    bgGradient: 'linear-gradient(145deg, #CCFBF1 0%, #99F6E4 100%)',
    borderColor: '#2DD4BF',
    funFact: 'Owls can turn their heads almost all the way around without moving their bodies!',
    svgArt: 'owl',
  },
];

// ─── HABITAT FILTER TABS ────────────────────────────────────────────────────
const TABS = [
  { id: 'all', label: 'All Friends', icon: '🌟' },
  { id: 'safari', label: 'Safari Savanna', icon: '🦁' },
  { id: 'farm', label: 'Happy Farm', icon: '🚜' },
  { id: 'forest', label: 'Deep Forest', icon: '🌲' },
  { id: 'magic', label: 'Magical Wonder', icon: '✨' },
];

// ─── Custom Animated SVG Characters ─────────────────────────────────────────
const AnimalSvgCharacter = ({ type, isActionActive }) => {
  switch (type) {
    case 'lion':
      return (
        <svg viewBox="0 0 160 160" className={`animal-svg animal-svg--lion ${isActionActive ? 'animal-svg--active' : ''}`}>
          {/* Mane */}
          <g className="lion-mane">
            <circle cx="80" cy="80" r="62" fill="#E28743" />
            <circle cx="80" cy="80" r="54" fill="#D36B26" />
            {/* Mane Tufts */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <circle
                key={deg}
                cx={80 + 58 * Math.cos((deg * Math.PI) / 180)}
                cy={80 + 58 * Math.sin((deg * Math.PI) / 180)}
                r="14"
                fill="#C25916"
              />
            ))}
          </g>
          {/* Ears */}
          <circle cx="48" cy="48" r="14" fill="#C25916" />
          <circle cx="48" cy="48" r="8" fill="#F8C291" />
          <circle cx="112" cy="48" r="14" fill="#C25916" />
          <circle cx="112" cy="48" r="8" fill="#F8C291" />
          {/* Head */}
          <circle cx="80" cy="84" r="42" fill="#F6B93B" />
          {/* Cheeks */}
          <ellipse cx="62" cy="98" rx="8" ry="5" fill="#FA983A" opacity="0.6" />
          <ellipse cx="98" cy="98" rx="8" ry="5" fill="#FA983A" opacity="0.6" />
          {/* Eyes */}
          <g className="lion-eyes">
            <ellipse cx="64" cy="76" rx="6" ry="8" fill="#1E272E" />
            <circle cx="62" cy="73" r="2.5" fill="#FFFFFF" />
            <ellipse cx="96" cy="76" rx="6" ry="8" fill="#1E272E" />
            <circle cx="94" cy="73" r="2.5" fill="#FFFFFF" />
          </g>
          {/* Snout & Nose */}
          <ellipse cx="80" cy="96" rx="18" ry="14" fill="#F8C291" />
          <polygon points="80,90 73,83 87,83" fill="#6B2D05" />
          {/* Mouth */}
          {isActionActive ? (
            <ellipse cx="80" cy="103" rx="10" ry="9" fill="#B71540" />
          ) : (
            <path d="M74,96 Q80,102 86,96" stroke="#6B2D05" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          )}
          {/* Whiskers */}
          <line x1="52" y1="94" x2="38" y2="92" stroke="#6B2D05" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="52" y1="99" x2="36" y2="102" stroke="#6B2D05" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="108" y1="94" x2="122" y2="92" stroke="#6B2D05" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="108" y1="99" x2="124" y2="102" stroke="#6B2D05" strokeWidth="1.5" strokeLinecap="round" />
          {/* Crown */}
          <polygon points="65,48 72,36 80,44 88,36 95,48" fill="#F9CA24" stroke="#F0932B" strokeWidth="1.5" />
        </svg>
      );

    case 'elephant':
      return (
        <svg viewBox="0 0 160 160" className={`animal-svg animal-svg--elephant ${isActionActive ? 'animal-svg--active' : ''}`}>
          {/* Big Flappy Ears */}
          <ellipse cx="34" cy="76" rx="28" ry="34" fill="#93C5FD" className="elephant-ear elephant-ear--l" />
          <ellipse cx="34" cy="76" rx="18" ry="24" fill="#BFDBFE" />
          <ellipse cx="126" cy="76" rx="28" ry="34" fill="#93C5FD" className="elephant-ear elephant-ear--r" />
          <ellipse cx="126" cy="76" rx="18" ry="24" fill="#BFDBFE" />
          {/* Head */}
          <circle cx="80" cy="80" r="42" fill="#60A5FA" />
          {/* Cheeks */}
          <ellipse cx="58" cy="94" rx="7" ry="5" fill="#F472B6" opacity="0.6" />
          <ellipse cx="102" cy="94" rx="7" ry="5" fill="#F472B6" opacity="0.6" />
          {/* Eyes */}
          <ellipse cx="64" cy="72" rx="5" ry="7" fill="#1E293B" />
          <circle cx="62" cy="70" r="2" fill="#FFFFFF" />
          <ellipse cx="96" cy="72" rx="5" ry="7" fill="#1E293B" />
          <circle cx="94" cy="70" r="2" fill="#FFFFFF" />
          {/* Trunk */}
          <g className={`elephant-trunk ${isActionActive ? 'elephant-trunk--trumpet' : ''}`}>
            <path
              d="M74,86 C74,106 86,116 86,128 C86,134 80,136 76,132"
              stroke="#3B82F6"
              strokeWidth="14"
              fill="none"
              strokeLinecap="round"
            />
            {/* Trunk folds */}
            <line x1="72" y1="98" x2="80" y2="98" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" />
            <line x1="75" y1="108" x2="84" y2="108" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" />
          </g>
          {/* Little Tusks */}
          <path d="M68,102 Q64,114 60,112 Q64,106 68,102" fill="#FFFFFF" />
          <path d="M92,102 Q96,114 100,112 Q96,106 92,102" fill="#FFFFFF" />
        </svg>
      );

    case 'monkey':
      return (
        <svg viewBox="0 0 160 160" className={`animal-svg animal-svg--monkey ${isActionActive ? 'animal-svg--active' : ''}`}>
          {/* Ears */}
          <circle cx="38" cy="76" r="18" fill="#B45309" />
          <circle cx="38" cy="76" r="11" fill="#FDE68A" />
          <circle cx="122" cy="76" r="18" fill="#B45309" />
          <circle cx="122" cy="76" r="11" fill="#FDE68A" />
          {/* Head */}
          <circle cx="80" cy="78" r="42" fill="#D97706" />
          {/* Face mask */}
          <path
            d="M60,66 C60,54 74,54 80,64 C86,54 100,54 100,66 C100,82 60,82 60,66 Z"
            fill="#FEF3C7"
          />
          {/* Snout */}
          <ellipse cx="80" cy="94" rx="24" ry="18" fill="#FEF3C7" />
          {/* Eyes */}
          <ellipse cx="68" cy="68" rx="5" ry="6" fill="#1F2937" />
          <circle cx="66" cy="66" r="2" fill="#FFFFFF" />
          <ellipse cx="92" cy="68" rx="5" ry="6" fill="#1F2937" />
          <circle cx="90" cy="66" r="2" fill="#FFFFFF" />
          {/* Nostrils */}
          <circle cx="76" cy="88" r="2" fill="#92400E" />
          <circle cx="84" cy="88" r="2" fill="#92400E" />
          {/* Mouth */}
          {isActionActive ? (
            <ellipse cx="80" cy="100" rx="12" ry="7" fill="#DC2626" />
          ) : (
            <path d="M72,96 Q80,105 88,96" stroke="#92400E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          )}
        </svg>
      );

    case 'dog':
      return (
        <svg viewBox="0 0 160 160" className={`animal-svg animal-svg--dog ${isActionActive ? 'animal-svg--active' : ''}`}>
          {/* Floppy Ears */}
          <path d="M38,52 C26,72 28,102 44,106 C50,106 50,86 48,68 Z" fill="#9A3412" className="dog-ear dog-ear--l" />
          <path d="M122,52 C134,72 132,102 116,106 C110,106 110,86 112,68 Z" fill="#9A3412" className="dog-ear dog-ear--r" />
          {/* Head */}
          <circle cx="80" cy="80" r="42" fill="#EA580C" />
          {/* Eye spot patch */}
          <ellipse cx="64" cy="74" rx="16" ry="18" fill="#C2410C" />
          {/* Eyes */}
          <ellipse cx="64" cy="74" rx="5" ry="7" fill="#1F2937" />
          <circle cx="62" cy="72" r="2" fill="#FFFFFF" />
          <ellipse cx="96" cy="74" rx="5" ry="7" fill="#1F2937" />
          <circle cx="94" cy="72" r="2" fill="#FFFFFF" />
          {/* Snout */}
          <ellipse cx="80" cy="94" rx="20" ry="14" fill="#FED7AA" />
          <ellipse cx="80" cy="88" rx="7" ry="5" fill="#431407" />
          {/* Mouth */}
          {isActionActive ? (
            <g>
              <ellipse cx="80" cy="98" rx="8" ry="6" fill="#DC2626" />
              <path d="M76,98 Q80,110 84,98" fill="#F87171" />
            </g>
          ) : (
            <path d="M74,94 Q80,100 86,94" stroke="#431407" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          )}
        </svg>
      );

    case 'cat':
      return (
        <svg viewBox="0 0 160 160" className={`animal-svg animal-svg--cat ${isActionActive ? 'animal-svg--active' : ''}`}>
          {/* Pointy Ears */}
          <polygon points="46,58 34,26 62,44" fill="#F472B6" />
          <polygon points="48,54 40,34 58,46" fill="#FCE7F3" />
          <polygon points="114,58 126,26 98,44" fill="#F472B6" />
          <polygon points="112,54 120,34 102,46" fill="#FCE7F3" />
          {/* Head */}
          <circle cx="80" cy="82" r="42" fill="#F472B6" />
          {/* Eyes */}
          <ellipse cx="62" cy="76" rx="7" ry="9" fill="#047857" />
          <ellipse cx="62" cy="76" rx="2.5" ry="7.5" fill="#064E3B" />
          <circle cx="60" cy="73" r="2" fill="#FFFFFF" />
          <ellipse cx="98" cy="76" rx="7" ry="9" fill="#047857" />
          <ellipse cx="98" cy="76" rx="2.5" ry="7.5" fill="#064E3B" />
          <circle cx="96" cy="73" r="2" fill="#FFFFFF" />
          {/* Nose */}
          <polygon points="80,90 76,86 84,86" fill="#BE185D" />
          {/* Whiskers */}
          <line x1="50" y1="92" x2="28" y2="88" stroke="#831843" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="50" y1="97" x2="26" y2="99" stroke="#831843" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="110" y1="92" x2="132" y2="88" stroke="#831843" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="110" y1="97" x2="134" y2="99" stroke="#831843" strokeWidth="1.5" strokeLinecap="round" />
          {/* Mouth */}
          <path d="M74,92 Q80,97 86,92" stroke="#831843" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'frog':
      return (
        <svg viewBox="0 0 160 160" className={`animal-svg animal-svg--frog ${isActionActive ? 'animal-svg--active' : ''}`}>
          {/* Big Frog Eye Bulges */}
          <circle cx="50" cy="54" r="20" fill="#10B981" />
          <circle cx="50" cy="54" r="14" fill="#FFFFFF" />
          <circle cx="52" cy="54" r="8" fill="#064E3B" />
          <circle cx="50" cy="51" r="3" fill="#FFFFFF" />
          <circle cx="110" cy="54" r="20" fill="#10B981" />
          <circle cx="110" cy="54" r="14" fill="#FFFFFF" />
          <circle cx="108" cy="54" r="8" fill="#064E3B" />
          <circle cx="106" cy="51" r="3" fill="#FFFFFF" />
          {/* Head & Body */}
          <ellipse cx="80" cy="88" rx="46" ry="38" fill="#34D399" />
          {/* Rosy Cheeks */}
          <ellipse cx="48" cy="94" rx="8" ry="5" fill="#F87171" opacity="0.6" />
          <ellipse cx="112" cy="94" rx="8" ry="5" fill="#F87171" opacity="0.6" />
          {/* Nostrils */}
          <circle cx="76" cy="80" r="1.5" fill="#065F46" />
          <circle cx="84" cy="80" r="1.5" fill="#065F46" />
          {/* Big Smiling Mouth */}
          {isActionActive ? (
            <ellipse cx="80" cy="96" rx="20" ry="12" fill="#B91C1C" />
          ) : (
            <path d="M54,88 Q80,110 106,88" stroke="#065F46" strokeWidth="3" fill="none" strokeLinecap="round" />
          )}
        </svg>
      );

    case 'duck':
      return (
        <svg viewBox="0 0 160 160" className={`animal-svg animal-svg--duck ${isActionActive ? 'animal-svg--active' : ''}`}>
          {/* Head */}
          <circle cx="80" cy="74" r="40" fill="#FBBF24" />
          {/* Cheek spots */}
          <ellipse cx="56" cy="84" rx="7" ry="5" fill="#F59E0B" opacity="0.6" />
          <ellipse cx="104" cy="84" rx="7" ry="5" fill="#F59E0B" opacity="0.6" />
          {/* Eyes */}
          <ellipse cx="66" cy="68" rx="5" ry="7" fill="#1F2937" />
          <circle cx="64" cy="66" r="2" fill="#FFFFFF" />
          <ellipse cx="94" cy="68" rx="5" ry="7" fill="#1F2937" />
          <circle cx="92" cy="66" r="2" fill="#FFFFFF" />
          {/* Big Orange Bill */}
          <path
            d={isActionActive ? "M58,88 Q80,78 102,88 Q80,116 58,88 Z" : "M60,86 Q80,80 100,86 Q80,106 60,86 Z"}
            fill="#EA580C"
            stroke="#C2410C"
            strokeWidth="2"
          />
          {/* Bill line */}
          <line x1="64" y1="92" x2="96" y2="92" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" />
          {/* Feather tuft */}
          <path d="M78,34 Q82,22 86,34" stroke="#F59E0B" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'cow':
      return (
        <svg viewBox="0 0 160 160" className={`animal-svg animal-svg--cow ${isActionActive ? 'animal-svg--active' : ''}`}>
          {/* Horns */}
          <path d="M48,46 Q38,28 32,34 Q40,48 48,46" fill="#F59E0B" />
          <path d="M112,46 Q122,28 128,34 Q120,48 112,46" fill="#F59E0B" />
          {/* Ears */}
          <ellipse cx="36" cy="62" rx="18" ry="10" fill="#E2E8F0" transform="rotate(-15 36 62)" />
          <ellipse cx="36" cy="62" rx="12" ry="6" fill="#FBCFE8" transform="rotate(-15 36 62)" />
          <ellipse cx="124" cy="62" rx="18" ry="10" fill="#E2E8F0" transform="rotate(15 124 62)" />
          <ellipse cx="124" cy="62" rx="12" ry="6" fill="#FBCFE8" transform="rotate(15 124 62)" />
          {/* Head */}
          <circle cx="80" cy="80" r="42" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
          {/* Black patches */}
          <path d="M50,44 C60,40 70,52 66,66 C56,68 44,56 50,44 Z" fill="#1E293B" />
          <path d="M106,46 C116,50 120,68 110,74 C100,72 96,56 106,46 Z" fill="#1E293B" />
          {/* Eyes */}
          <ellipse cx="64" cy="72" rx="5" ry="7" fill="#1E293B" />
          <circle cx="62" cy="70" r="2" fill="#FFFFFF" />
          <ellipse cx="96" cy="72" rx="5" ry="7" fill="#1E293B" />
          <circle cx="94" cy="70" r="2" fill="#FFFFFF" />
          {/* Big Pink Snout */}
          <ellipse cx="80" cy="98" rx="28" ry="18" fill="#FBCFE8" />
          <circle cx="72" cy="95" r="3.5" fill="#BE185D" />
          <circle cx="88" cy="95" r="3.5" fill="#BE185D" />
          {/* Bell */}
          <polygon points="76,122 84,122 82,132 78,132" fill="#F59E0B" />
          <circle cx="80" cy="133" r="3" fill="#D97706" />
        </svg>
      );

    case 'fox':
      return (
        <svg viewBox="0 0 160 160" className={`animal-svg animal-svg--fox ${isActionActive ? 'animal-svg--active' : ''}`}>
          {/* Big Ears */}
          <polygon points="46,58 30,16 66,42" fill="#EA580C" />
          <polygon points="48,52 38,26 62,44" fill="#FFFFFF" />
          <polygon points="114,58 130,16 94,42" fill="#EA580C" />
          <polygon points="112,52 122,26 98,44" fill="#FFFFFF" />
          {/* Head */}
          <circle cx="80" cy="80" r="42" fill="#EA580C" />
          {/* White Mask Cheeks */}
          <path d="M50,76 Q80,104 60,118 Q42,94 50,76 Z" fill="#FFFFFF" />
          <path d="M110,76 Q80,104 100,118 Q118,94 110,76 Z" fill="#FFFFFF" />
          {/* Eyes */}
          <ellipse cx="64" cy="74" rx="5" ry="7" fill="#1F2937" />
          <circle cx="62" cy="72" r="2" fill="#FFFFFF" />
          <ellipse cx="96" cy="74" rx="5" ry="7" fill="#1F2937" />
          <circle cx="94" cy="72" r="2" fill="#FFFFFF" />
          {/* Snout */}
          <polygon points="80,104 74,94 86,94" fill="#1F2937" />
        </svg>
      );

    case 'panda':
      return (
        <svg viewBox="0 0 160 160" className={`animal-svg animal-svg--panda ${isActionActive ? 'animal-svg--active' : ''}`}>
          {/* Black Ears */}
          <circle cx="44" cy="46" r="16" fill="#111827" />
          <circle cx="116" cy="46" r="16" fill="#111827" />
          {/* White Head */}
          <circle cx="80" cy="82" r="44" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="2" />
          {/* Black Eye Patches */}
          <ellipse cx="58" cy="76" rx="14" ry="12" fill="#111827" transform="rotate(-15 58 76)" />
          <ellipse cx="102" cy="76" rx="14" ry="12" fill="#111827" transform="rotate(15 102 76)" />
          {/* Eyes inside patch */}
          <circle cx="58" cy="76" r="5" fill="#FFFFFF" />
          <circle cx="59" cy="76" r="2.5" fill="#111827" />
          <circle cx="102" cy="76" r="5" fill="#FFFFFF" />
          <circle cx="101" cy="76" r="2.5" fill="#111827" />
          {/* Nose */}
          <ellipse cx="80" cy="94" rx="7" ry="5" fill="#111827" />
          <path d="M75,98 Q80,104 85,98" stroke="#111827" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Bamboo Sprig */}
          <rect x="114" y="80" width="6" height="34" rx="3" fill="#10B981" transform="rotate(25 114 80)" />
          <ellipse cx="126" cy="88" rx="8" ry="3" fill="#34D399" transform="rotate(25 126 88)" />
        </svg>
      );

    case 'unicorn':
      return (
        <svg viewBox="0 0 160 160" className={`animal-svg animal-svg--unicorn ${isActionActive ? 'animal-svg--active' : ''}`}>
          {/* Golden Horn */}
          <polygon points="80,12 73,50 87,50" fill="#FBBF24" stroke="#F59E0B" strokeWidth="2" />
          <line x1="75" y1="40" x2="85" y2="44" stroke="#D97706" strokeWidth="2" />
          <line x1="77" y1="28" x2="83" y2="32" stroke="#D97706" strokeWidth="2" />
          {/* Rainbow Mane */}
          <path d="M48,56 C38,42 42,26 58,34" fill="#F472B6" />
          <path d="M42,70 C30,58 34,44 50,50" fill="#818CF8" />
          <path d="M38,86 C26,74 30,60 46,66" fill="#34D399" />
          {/* Ears */}
          <polygon points="106,58 116,28 92,44" fill="#EDE9FE" />
          <polygon points="104,52 110,36 96,44" fill="#FBCFE8" />
          {/* Head */}
          <circle cx="80" cy="82" r="42" fill="#FAF5FF" stroke="#DDD6FE" strokeWidth="2" />
          {/* Cheeks */}
          <ellipse cx="62" cy="94" rx="7" ry="5" fill="#F472B6" opacity="0.6" />
          <ellipse cx="98" cy="94" rx="7" ry="5" fill="#F472B6" opacity="0.6" />
          {/* Eyes with Lashes */}
          <path d="M60,78 Q66,70 72,78" stroke="#6B21A8" strokeWidth="3" fill="none" strokeLinecap="round" />
          <line x1="71" y1="74" x2="74" y2="70" stroke="#6B21A8" strokeWidth="2" strokeLinecap="round" />
          <path d="M88,78 Q94,70 100,78" stroke="#6B21A8" strokeWidth="3" fill="none" strokeLinecap="round" />
          <line x1="99" y1="74" x2="102" y2="70" stroke="#6B21A8" strokeWidth="2" strokeLinecap="round" />
          {/* Snout */}
          <ellipse cx="80" cy="98" rx="16" ry="10" fill="#FCE7F3" />
          <circle cx="76" cy="96" r="2" fill="#BE185D" />
          <circle cx="84" cy="96" r="2" fill="#BE185D" />
          {/* Sparkle Star */}
          <polygon points="120,40 123,46 129,49 123,52 120,58 117,52 111,49 117,46" fill="#FDE047" />
        </svg>
      );

    case 'owl':
    default:
      return (
        <svg viewBox="0 0 160 160" className={`animal-svg animal-svg--owl ${isActionActive ? 'animal-svg--active' : ''}`}>
          {/* Ear Tufts */}
          <polygon points="48,56 40,28 66,46" fill="#0F766E" />
          <polygon points="112,56 120,28 94,46" fill="#0F766E" />
          {/* Body */}
          <ellipse cx="80" cy="86" rx="44" ry="48" fill="#14B8A6" />
          <ellipse cx="80" cy="94" rx="30" ry="34" fill="#CCFBF1" />
          {/* Big Owl Eyes */}
          <circle cx="62" cy="72" r="16" fill="#FEF08A" />
          <circle cx="62" cy="72" r="9" fill="#134E4A" />
          <circle cx="60" cy="69" r="3" fill="#FFFFFF" />
          <circle cx="98" cy="72" r="16" fill="#FEF08A" />
          <circle cx="98" cy="72" r="9" fill="#134E4A" />
          <circle cx="96" cy="69" r="3" fill="#FFFFFF" />
          {/* Beak */}
          <polygon points="80,88 74,78 86,78" fill="#F59E0B" />
          {/* Belly Feathers */}
          <path d="M72,104 Q80,108 88,104" stroke="#0D9488" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M70,114 Q80,118 90,114" stroke="#0D9488" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
      );
  }
};

// ─── Main AnimalSafari Component ────────────────────────────────────────────
const AnimalSafari = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [activeAnimalId, setActiveAnimalId] = useState(null);
  const [isPartyRunning, setIsPartyRunning] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [muted, setMutedState] = useState(getMuted());
  const [sparkleParticles, setSparkleParticles] = useState([]);
  
  // Mystery Guess Mini-Game State
  const [isGameActive, setIsGameActive] = useState(false);
  const [mysteryTarget, setMysteryTarget] = useState(null);
  const [gameFeedback, setGameFeedback] = useState(null);
  const [gameScore, setGameScore] = useState(0);

  const containerRef = useRef(null);
  const audioContextInitialized = useRef(false);

  // Filtered animals list
  const displayedAnimals = ANIMALS.filter(
    (a) => activeTab === 'all' || a.habitat === activeTab
  );

  // Toggle Mute
  const handleToggleMute = () => {
    const nextMute = !muted;
    setMutedState(nextMute);
    setMuted(nextMute);
    if (!nextMute) {
      playPopSound();
    }
  };

  // Sparkle particle burst effect helper
  const triggerParticles = (x, y, color = '#FF6B35') => {
    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: `${Date.now()}-${i}`,
      x,
      y,
      color,
      angle: (i * 45 * Math.PI) / 180,
      speed: 40 + Math.random() * 40,
    }));
    setSparkleParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setSparkleParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 900);
  };

  // Click on Animal: Play sound + voice + animations
  const handleAnimalClick = useCallback(
    (animal, e) => {
      // Initialize audio on first click
      if (!audioContextInitialized.current) {
        getAudioContext();
        audioContextInitialized.current = true;
      }

      // If Guess-The-Sound game is active
      if (isGameActive && mysteryTarget) {
        if (animal.id === mysteryTarget.id) {
          setGameScore((s) => s + 1);
          setGameFeedback({
            type: 'success',
            msg: `🎉 Yaaay! Correct! You found ${animal.name}!`,
          });
          playAnimalSound(animal.type);
          if (voiceEnabled) {
            speakAnimalGreeting(`Yay! That is right! I am ${animal.name}!`);
          }
          setActiveAnimalId(animal.id);
          // Pick next mystery animal after 2s
          setTimeout(() => {
            const nextPool = ANIMALS.filter((a) => a.id !== animal.id);
            const nextTarget = nextPool[Math.floor(Math.random() * nextPool.length)];
            setMysteryTarget(nextTarget);
            setGameFeedback({
              type: 'listen',
              msg: `👂 Listen closely... Who makes this sound?`,
            });
            setTimeout(() => {
              playAnimalSound(nextTarget.type);
            }, 400);
          }, 2200);
          return;
        } else {
          setGameFeedback({
            type: 'try-again',
            msg: `Oops! That was ${animal.name}. Try again!`,
          });
          playAnimalSound(animal.type);
          return;
        }
      }

      // Standard mode
      setActiveAnimalId(animal.id);

      // Play custom procedural Web Audio sound
      playAnimalSound(animal.type);

      // Optional friendly vocal greeting
      if (voiceEnabled) {
        setTimeout(() => {
          speakAnimalGreeting(`${animal.sound}! I'm ${animal.name}!`);
        }, 180);
      }

      // Trigger sparkle particle coordinates
      if (e && e.clientX) {
        const rect = e.currentTarget.getBoundingClientRect();
        triggerParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, animal.color);
      }

      // Reset active state after 2.4s
      setTimeout(() => {
        setActiveAnimalId((curr) => (curr === animal.id ? null : curr));
      }, 2400);
    },
    [isGameActive, mysteryTarget, voiceEnabled]
  );

  // Animal Party Mode: All animals dance & play in symphony
  const handleAnimalParty = () => {
    if (isPartyRunning) return;
    setIsPartyRunning(true);
    getAudioContext();

    ANIMALS.forEach((animal, index) => {
      setTimeout(() => {
        setActiveAnimalId(animal.id);
        playAnimalSound(animal.type);
      }, index * 260);
    });

    setTimeout(() => {
      setIsPartyRunning(false);
      setActiveAnimalId(null);
    }, ANIMALS.length * 260 + 1200);
  };

  // Start / Stop Mystery Sound Game
  const handleToggleMysteryGame = () => {
    if (isGameActive) {
      setIsGameActive(false);
      setMysteryTarget(null);
      setGameFeedback(null);
    } else {
      setIsGameActive(true);
      const target = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
      setMysteryTarget(target);
      setGameFeedback({
        type: 'listen',
        msg: `👂 Listen closely... Which animal made that sound?`,
      });
      setTimeout(() => {
        playAnimalSound(target.type);
      }, 500);
    }
  };

  // Replay Mystery Sound
  const handleReplayMysterySound = () => {
    if (mysteryTarget) {
      playAnimalSound(mysteryTarget.type);
    }
  };

  return (
    <section className="animal-safari" ref={containerRef} id="animal-safari">
      {/* Decorative Floating Clouds & Star Sparkles */}
      <div className="animal-safari__decor animal-safari__decor--cloud1" aria-hidden="true">☁️</div>
      <div className="animal-safari__decor animal-safari__decor--cloud2" aria-hidden="true">☁️</div>
      <div className="animal-safari__decor animal-safari__decor--star1" aria-hidden="true">⭐</div>
      <div className="animal-safari__decor animal-safari__decor--star2" aria-hidden="true">✨</div>

      <div className="animal-safari__container">
        {/* ─── SECTION HEADER ─── */}
        <div className="animal-safari__header">
          <div className="animal-safari__chip">
            <FiStar className="chip-icon" />
            <span>Interactive Fun Zone</span>
          </div>

          <h2 className="animal-safari__title">
            Meet Our <span className="animal-safari__title--accent">Animated Animal</span> Kingdom!
          </h2>

          <p className="animal-safari__desc">
            Tap or click any animal to hear its <strong>authentic voice & sound</strong>! Watch them giggle, bounce, and share their story!
          </p>

          {/* ─── ACTION TOOLBAR ─── */}
          <div className="animal-safari__toolbar">
            {/* Sound Mute Toggle */}
            <button
              type="button"
              className={`safari-tool-btn ${muted ? 'safari-tool-btn--muted' : 'safari-tool-btn--active'}`}
              onClick={handleToggleMute}
              title={muted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {muted ? <FiVolumeX /> : <FiVolume2 />}
              <span>{muted ? 'Sound: OFF' : 'Sound: ON'}</span>
            </button>

            {/* Voice Greeting Toggle */}
            <button
              type="button"
              className={`safari-tool-btn ${voiceEnabled ? 'safari-tool-btn--active' : ''}`}
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              title="Toggle Animal Voice Greetings"
            >
              <span>🗣️ Voice: {voiceEnabled ? 'ON' : 'OFF'}</span>
            </button>

            {/* Animal Party Symphony Button */}
            <button
              type="button"
              className={`safari-tool-btn safari-tool-btn--party ${isPartyRunning ? 'is-dancing' : ''}`}
              onClick={handleAnimalParty}
              disabled={isPartyRunning}
            >
              <FiMusic />
              <span>{isPartyRunning ? 'Dancing in Symphony! 🎵' : '🎉 Animal Party!'}</span>
            </button>

            {/* Mystery Sound Guess Game Button */}
            <button
              type="button"
              className={`safari-tool-btn safari-tool-btn--game ${isGameActive ? 'is-playing' : ''}`}
              onClick={handleToggleMysteryGame}
            >
              <FiHelpCircle />
              <span>{isGameActive ? 'Exit Game' : '🎯 Guess The Sound Game'}</span>
            </button>
          </div>

          {/* ─── MYSTERY GAME BANNER (when active) ─── */}
          {isGameActive && (
            <div className="safari-game-banner">
              <div className="safari-game-banner__info">
                <span className="safari-game-banner__score">
                  <FiAward /> Score: <strong>{gameScore}</strong>
                </span>
                <p className="safari-game-banner__msg">{gameFeedback?.msg || 'Listen carefully...'}</p>
              </div>
              <button
                type="button"
                className="safari-game-banner__replay-btn"
                onClick={handleReplayMysterySound}
                title="Hear sound again"
              >
                <FiRotateCw /> Play Sound Again 🔊
              </button>
            </div>
          )}

          {/* ─── HABITAT FILTER TABS ─── */}
          {!isGameActive && (
            <div className="animal-safari__tabs">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`safari-tab ${activeTab === tab.id ? 'safari-tab--active' : ''}`}
                  onClick={() => {
                    playPopSound();
                    setActiveTab(tab.id);
                  }}
                >
                  <span className="safari-tab__icon">{tab.icon}</span>
                  <span className="safari-tab__label">{tab.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─── ANIMALS GRID ─── */}
        <div className="animal-safari__grid">
          {displayedAnimals.map((animal) => {
            const isActive = activeAnimalId === animal.id;
            return (
              <div
                key={animal.id}
                className={`animal-card ${isActive ? 'animal-card--active' : ''}`}
                style={{
                  '--card-theme': animal.color,
                  '--card-bg': animal.bgGradient,
                  '--card-border': animal.borderColor,
                }}
                onClick={(e) => handleAnimalClick(animal, e)}
                role="button"
                tabIndex={0}
                aria-label={`Tap to hear ${animal.name} make sound`}
                onKeyDown={(e) => e.key === 'Enter' && handleAnimalClick(animal, e)}
              >
                {/* Speech Bubble on click */}
                {isActive && (
                  <div className="animal-card__bubble" aria-live="polite">
                    <span className="animal-card__bubble-sound">{animal.sound}</span>
                    <div className="animal-card__sound-wave">
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                )}

                {/* Habitat Badge */}
                <div className="animal-card__badge">
                  <span>{animal.icon}</span>
                  <span>{animal.habitatLabel}</span>
                </div>

                {/* Visual Avatar with 3D/Hover Perspective */}
                <div className="animal-card__avatar-wrap">
                  <div className="animal-card__avatar-glow" />
                  <AnimalSvgCharacter type={animal.type} isActionActive={isActive} />

                  {/* Pulsing Sound Rings when active */}
                  {isActive && (
                    <div className="animal-card__rings" aria-hidden="true">
                      <div className="ring ring--1" />
                      <div className="ring ring--2" />
                    </div>
                  )}
                </div>

                {/* Card Content & Name */}
                <div className="animal-card__content">
                  <h3 className="animal-card__name">{animal.name}</h3>
                  <span className="animal-card__title">{animal.title}</span>
                  <p className="animal-card__fact">{animal.funFact}</p>

                  {/* Action Button */}
                  <div className="animal-card__action">
                    <span className="animal-card__btn">
                      <FiVolume2 className="btn-icon" />
                      {isActive ? 'Listening...' : 'Tap to Hear Me!'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Whimsical Tip */}
        <div className="animal-safari__footer-tip">
          <span>💡 <strong>Kidroo Fun Tip:</strong> All animal sounds are synthesized with Web Audio magic — no buffering, always responsive!</span>
        </div>
      </div>
    </section>
  );
};

export default AnimalSafari;
