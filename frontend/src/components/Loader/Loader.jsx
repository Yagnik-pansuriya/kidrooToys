import './Loader.scss';

const BRAND_LETTERS = ['K', 'i', 'd', 'r', 'o', 'o'];

/**
 * Dynamic Kidroo Loader — Premium UI
 *
 * Props:
 *  - fullscreen  {boolean}  Fixed overlay (app splash)
 *  - inline      {boolean}  Compact version for sections
 *  - message     {string}   Optional status text
 *  - logo        {string}   Optional logo URL
 *  - colors      {object}   Override { primary, hover, header, footer }
 */
const Loader = ({
  fullscreen = false,
  inline = false,
  message = '',
  logo = null,
  colors = null,
}) => {
  const mode = inline ? 'inline' : 'fullscreen';

  const colorStyle = colors
    ? {
        '--loader-primary': colors.primary,
        '--loader-hover':   colors.hover,
        '--loader-header':  colors.header,
        '--loader-footer':  colors.footer,
      }
    : {};

  return (
    <div
      className={`kidroo-loader kidroo-loader--${mode}`}
      style={colorStyle}
      role="status"
      aria-label={message || 'Loading'}
    >
      {/* Decorative ring (fullscreen only) */}
      {!inline && <div className="kidroo-loader__ring" />}

      {/* Optional logo */}
      {logo && (
        <img
          src={logo}
          alt="Kidroo"
          className="kidroo-loader__logo"
        />
      )}

      {/* Animated brand text */}
      <div className="kidroo-loader__brand">
        {BRAND_LETTERS.map((letter, i) => (
          <span
            key={i}
            className="kidroo-loader__letter"
            style={{ '--i': i }}
            data-letter={letter}
          >
            {letter}
          </span>
        ))}
      </div>

      {/* Tagline (fullscreen only) */}
      {!inline && (
        <p className="kidroo-loader__tagline">Where Imagination Comes to Play</p>
      )}

      {/* Shimmer progress bar */}
      <div className="kidroo-loader__progress">
        <div className="kidroo-loader__progress-bar" />
      </div>

      {/* Bouncing dots */}
      <div className="kidroo-loader__dots">
        <span className="kidroo-loader__dot" />
        <span className="kidroo-loader__dot" />
        <span className="kidroo-loader__dot" />
      </div>

      {/* Optional message */}
      {message && (
        <p className="kidroo-loader__message">{message}</p>
      )}
    </div>
  );
};

export default Loader;
