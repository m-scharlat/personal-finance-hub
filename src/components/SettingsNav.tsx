import { NavLink } from 'react-router-dom'

const LINKS = [
  { to: '/settings/net-worth',       label: 'Accounts'        },
  { to: '/settings/categories',      label: 'Categories'      },
  { to: '/settings/import-mappings', label: 'Import'          },
  { to: '/settings/profile',         label: 'Profile'         },
]

export default function SettingsNav() {
  return (
    <div className="mt-5 flex items-center gap-1 border-b border-border mb-6">
      {LINKS.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `px-1 pb-3 mr-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              isActive
                ? 'border-terra text-terra'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </div>
  )
}
