import PropTypes from 'prop-types'

const WatermarkOverlay = ({ text }) => {
  const lines = Array.from({ length: 36 }, (_, index) => `${text}  |  ${index + 1}`)

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="watermark-surface">
        {lines.map((line, index) => (
          <span
            key={`${line}-${index}`}
            className="watermark-line text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600 md:text-xs"
            style={{ animationDelay: `${(index % 6) * 0.35}s` }}
          >
            {line}
          </span>
        ))}
      </div>
    </div>
  )
}

WatermarkOverlay.propTypes = {
  text: PropTypes.string.isRequired,
}

export default WatermarkOverlay
