import { FaMoon, FaSun } from 'react-icons/fa'
import { useTheme } from '../context/ThemeContext'
import PropTypes from 'prop-types'

const ThemeToggle = ({ compact = false, className = '' }) => {
  const { isDark, toggleTheme } = useTheme()

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`relative flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100/80 dark:bg-neutral-900/80 text-neutral-700 dark:text-neutral-300 transition-all hover:bg-neutral-200/80 dark:hover:bg-neutral-800 ${className}`}
        title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
        aria-label="Toggle theme"
      >
        {isDark ? (
          <FaSun className="text-amber-400 text-xs transition-transform duration-200 hover:rotate-45" />
        ) : (
          <FaMoon className="text-neutral-700 text-xs transition-transform duration-200 hover:-rotate-12" />
        )}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center gap-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100/80 dark:bg-neutral-900/80 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 transition-all hover:bg-neutral-200/80 dark:hover:bg-neutral-800 ${className}`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <FaSun className="text-amber-400 text-[10px]" />
      ) : (
        <FaMoon className="text-neutral-600 text-[10px]" />
      )}
      <span className="text-[11px] font-medium tracking-tight">
        {isDark ? 'Dark' : 'Light'}
      </span>
    </button>
  )
}

ThemeToggle.propTypes = {
  compact: PropTypes.bool,
  className: PropTypes.string,
}

export default ThemeToggle
