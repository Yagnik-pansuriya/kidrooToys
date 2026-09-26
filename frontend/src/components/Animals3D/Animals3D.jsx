import { useState, useCallback } from 'react';
import './Animals3D.scss';

/* ─── Animal messages ─── */
const MESSAGES = {
  dog:     ["Woof! I love Kidroo! 🐾", "Play fetch with me! 🎾", "Best toy store ever! 🦴"],
  cat:     ["Purrr... premium toys 😺", "Meow! I approve this! ✨", "Cats love Kidroo too! 🐟"],
  fox:     ["Clever fox picks Kidroo! 🦊", "Brain games are my fav! 🧩", "Outsmart boredom! 🌟"],
  frog:    ["Ribbit! Jump into fun! 🎈", "Leap to kidroo.in! 🐸", "Hop hop hooray! 🎉"],
  unicorn: ["Magical toys for magical kids! 🌈", "Sparkle & play! ✨", "Unicorn approved! 🦄"],
  panda:   ["Pandas pick Kidroo! 🎍", "Bamboo toys are best! 🐼", "So soft, so fun! 💕"],
};

/* ─── Single CSS 3D Animal ─── */
const Animal3D = ({ type, label }) => {
  const [clicked, setClicked] = useState(false);
  const [msg, setMsg] = useState('');

  const handleClick = useCallback(() => {
    const msgs = MESSAGES[type];
    setMsg(msgs[Math.floor(Math.random() * msgs.length)]);
    setClicked(true);
    setTimeout(() => { setClicked(false); setMsg(''); }, 2400);
  }, [type]);

  return (
    <div className={`a3d a3d--${type} ${clicked ? 'a3d--clicked' : ''}`} onClick={handleClick} role="button" tabIndex={0} aria-label={`Click the ${label}`} onKeyDown={e => e.key === 'Enter' && handleClick()}>
      {/* Speech bubble */}
      {msg && <div className="a3d__bubble" aria-live="polite">{msg}</div>}

      {/* Animal body wrapper with 3D scene */}
      <div className="a3d__scene">
        <div className="a3d__body-wrap">

          {/* ── DOG ── */}
          {type === 'dog' && (
            <div className="dog">
              <div className="dog__ear dog__ear--l" />
              <div className="dog__ear dog__ear--r" />
              <div className="dog__head">
                <div className="dog__eye dog__eye--l"><div className="dog__pupil" /></div>
                <div className="dog__eye dog__eye--r"><div className="dog__pupil" /></div>
                <div className="dog__snout">
                  <div className="dog__nose" />
                  <div className="dog__mouth" />
                </div>
              </div>
              <div className="dog__body">
                <div className="dog__belly" />
                <div className="dog__paw dog__paw--l" />
                <div className="dog__paw dog__paw--r" />
                <div className="dog__tail" />
              </div>
            </div>
          )}

          {/* ── CAT ── */}
          {type === 'cat' && (
            <div className="cat">
              <div className="cat__ear cat__ear--l"><div className="cat__ear-in" /></div>
              <div className="cat__ear cat__ear--r"><div className="cat__ear-in" /></div>
              <div className="cat__head">
                <div className="cat__eye cat__eye--l"><div className="cat__pupil" /></div>
                <div className="cat__eye cat__eye--r"><div className="cat__pupil" /></div>
                <div className="cat__nose" />
                <div className="cat__whisker cat__whisker--l1" />
                <div className="cat__whisker cat__whisker--l2" />
                <div className="cat__whisker cat__whisker--r1" />
                <div className="cat__whisker cat__whisker--r2" />
              </div>
              <div className="cat__body">
                <div className="cat__belly" />
                <div className="cat__tail" />
              </div>
            </div>
          )}

          {/* ── FOX ── */}
          {type === 'fox' && (
            <div className="fox">
              <div className="fox__ear fox__ear--l"><div className="fox__ear-in" /></div>
              <div className="fox__ear fox__ear--r"><div className="fox__ear-in" /></div>
              <div className="fox__head">
                <div className="fox__mask" />
                <div className="fox__eye fox__eye--l"><div className="fox__pupil" /></div>
                <div className="fox__eye fox__eye--r"><div className="fox__pupil" /></div>
                <div className="fox__snout">
                  <div className="fox__nose" />
                </div>
              </div>
              <div className="fox__body">
                <div className="fox__belly" />
                <div className="fox__tail"><div className="fox__tail-tip" /></div>
              </div>
            </div>
          )}

          {/* ── FROG ── */}
          {type === 'frog' && (
            <div className="frog">
              <div className="frog__eye frog__eye--l"><div className="frog__pupil" /></div>
              <div className="frog__eye frog__eye--r"><div className="frog__pupil" /></div>
              <div className="frog__head">
                <div className="frog__nose" />
                <div className="frog__mouth" />
              </div>
              <div className="frog__body">
                <div className="frog__belly" />
                <div className="frog__leg frog__leg--l" />
                <div className="frog__leg frog__leg--r" />
              </div>
            </div>
          )}

          {/* ── UNICORN ── */}
          {type === 'unicorn' && (
            <div className="unicorn">
              <div className="unicorn__horn" />
              <div className="unicorn__mane">
                <div className="unicorn__mane-s1" />
                <div className="unicorn__mane-s2" />
                <div className="unicorn__mane-s3" />
              </div>
              <div className="unicorn__head">
                <div className="unicorn__eye unicorn__eye--l"><div className="unicorn__pupil" /><div className="unicorn__lash" /></div>
                <div className="unicorn__eye unicorn__eye--r"><div className="unicorn__pupil" /><div className="unicorn__lash" /></div>
                <div className="unicorn__nose" />
              </div>
              <div className="unicorn__body">
                <div className="unicorn__belly" />
                <div className="unicorn__leg unicorn__leg--fl" />
                <div className="unicorn__leg unicorn__leg--fr" />
                <div className="unicorn__tail"><div className="unicorn__tail-s1" /><div className="unicorn__tail-s2" /></div>
              </div>
            </div>
          )}

          {/* ── PANDA ── */}
          {type === 'panda' && (
            <div className="panda">
              <div className="panda__ear panda__ear--l" />
              <div className="panda__ear panda__ear--r" />
              <div className="panda__head">
                <div className="panda__patch panda__patch--l" />
                <div className="panda__patch panda__patch--r" />
                <div className="panda__eye panda__eye--l"><div className="panda__pupil" /></div>
                <div className="panda__eye panda__eye--r"><div className="panda__pupil" /></div>
                <div className="panda__nose" />
                <div className="panda__mouth" />
              </div>
              <div className="panda__body">
                <div className="panda__belly" />
                <div className="panda__arm panda__arm--l" />
                <div className="panda__arm panda__arm--r" />
              </div>
            </div>
          )}

        </div>

        {/* Ground shadow */}
        <div className="a3d__shadow" aria-hidden="true" />
      </div>

      <span className="a3d__label">{label}</span>
    </div>
  );
};

/* ─── Animals3D exported component ─── */
const Animals3D = () => {
  const animals = [
    { type: 'dog',     label: 'Buddy the Dog' },
    { type: 'cat',     label: 'Luna the Cat' },
    { type: 'fox',     label: 'Finn the Fox' },
    { type: 'frog',    label: 'Froggy' },
    { type: 'unicorn', label: 'Sparkle' },
    { type: 'panda',   label: 'Bao the Panda' },
  ];

  return (
    <section className="animals3d-section" aria-label="3D toy animals">
      <div className="container">
        <div className="animals3d-header">
          <span className="animals3d-chip">🐾 Meet Our Friends</span>
          <h2 className="animals3d-title">Click on Them!</h2>
          <p className="animals3d-sub">Every Kidroo toy comes to life — just like these little ones!</p>
        </div>
        <div className="animals3d-grid">
          {animals.map(a => <Animal3D key={a.type} {...a} />)}
        </div>
      </div>
    </section>
  );
};

export default Animals3D;
