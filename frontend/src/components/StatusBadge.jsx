import PropTypes from 'prop-types'
import { getStatusTheme, normalizeStatus } from '../utils/status'

const StatusBadge = ({ status }) => {
  const normalizedStatus = normalizeStatus(status)

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getStatusTheme(
        normalizedStatus,
      )}`}
    >
      {normalizedStatus}
    </span>
  )
}

StatusBadge.propTypes = {
  status: PropTypes.string,
}

export default StatusBadge
