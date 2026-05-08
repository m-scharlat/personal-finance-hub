import { NavLink } from 'react-router-dom'

const LINKS = [
  { to: '/settings/categories',      label: 'Categories' },
  { to: '/settings/import-mappings', label: 'Import Mappings' },
]

export default function SettingsNav() {
  return (
    <div className="mt-5 flex items-center gap-1 border-b border-gray-200 dark:border-gray-800 mb-6">
      {LINKS.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `px-1 pb-3 mr-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              isActive
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </div>
  )
}
