import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes, FaTrashAlt } from 'react-icons/fa'
import { useSocket } from '../context/SocketContext'

const typeStyles = {
  created: {
    bg: 'bg-emerald-50 border-emerald-300 text-emerald-900',
    icon: FaCheckCircle,
    iconColor: 'text-emerald-600',
    badge: 'bg-emerald-600 text-white',
  },
  updated: {
    bg: 'bg-sky-50 border-sky-300 text-sky-900',
    icon: FaInfoCircle,
    iconColor: 'text-sky-600',
    badge: 'bg-sky-600 text-white',
  },
  revoked: {
    bg: 'bg-amber-50 border-amber-300 text-amber-900',
    icon: FaExclamationTriangle,
    iconColor: 'text-amber-600',
    badge: 'bg-amber-600 text-white',
  },
  deleted: {
    bg: 'bg-rose-50 border-rose-300 text-rose-900',
    icon: FaTrashAlt,
    iconColor: 'text-rose-600',
    badge: 'bg-rose-600 text-white',
  },
}

const RealtimeToastContainer = () => {
  const { notifications, dismissNotification } = useSocket()

  if (!notifications || notifications.length === 0) {
    return null
  }

  return (
    <aside
      aria-label="Real-time notifications"
      className="fixed right-4 top-20 z-50 flex max-w-sm flex-col gap-2.5 sm:right-6 pointer-events-none"
    >
      {notifications.map((item) => {
        const style = typeStyles[item.type] || typeStyles.updated
        const Icon = style.icon

        return (
          <div
            key={item.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-xl transition-all duration-300 animate-slide-in ${style.bg}`}
          >
            <Icon className={`mt-0.5 text-lg flex-shrink-0 ${style.iconColor}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-wider">{item.title}</p>
                <span className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-white/70">
                  Live
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-700 leading-relaxed break-words">{item.message}</p>
            </div>
            <button
              type="button"
              onClick={() => dismissNotification(item.id)}
              className="text-slate-400 hover:text-slate-700 transition p-1"
              aria-label="Dismiss notification"
            >
              <FaTimes className="text-xs" />
            </button>
          </div>
        )
      })}
    </aside>
  )
}

export default RealtimeToastContainer
