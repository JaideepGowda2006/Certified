import PropTypes from 'prop-types'
import { normalizeStatus } from '../utils/status'

const StatusBadge = ({ status }) => {
  const normalizedStatus = normalizeStatus(status)

  let colorClasses = 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-400/40 dark:border-emerald-500/30'
  let dotClasses = 'bg-emerald-500 animate-pulse'

  if (normalizedStatus === 'revoked') {
    colorClasses = 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-400/40 dark:border-rose-500/30'
    dotClasses = 'bg-rose-500'
  } else if (normalizedStatus === 'expired') {
    colorClasses = 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-400/40 dark:border-amber-500/30'
    dotClasses = 'bg-amber-500'
  }

  return (
    <span
      className={`liquid-pill inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colorClasses}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClasses}`} />
      {normalizedStatus}
    </span>
  )
}

StatusBadge.propTypes = {
  status: PropTypes.string,
}

export default StatusBadge
