// Cozy direction — warm cream background with WHITE cards for crisp contrast.
// Sans-only, friendly Claude-meets-Arc.

const cozyTheme = {
  mode: 'light',

  // Backgrounds — warmer bg, whiter cards
  bg: '#f1ebe1',            // warm cream
  bgAlt: '#ebe4d6',         // slightly deeper for nav strip
  surface: '#ffffff',       // CARDS — pure white for contrast
  surfaceAlt: '#fbf8f2',    // sub-surface (filters, table headers)

  // Hairlines + dividers
  border: 'rgba(60,40,20,0.07)',
  borderStrong: 'rgba(60,40,20,0.12)',

  // Text
  ink: '#2a201a',
  inkMuted: '#7a6a5c',
  inkFaint: '#a89789',

  // Semantic — these reference the global palette but cache the light values
  // so existing components can keep reading theme.terra/forest/red etc.
  terra:  '#c66b46',
  forest: '#3d6b54',
  red:    '#b8492f',
  amber:  '#c98a3a',
  violet: '#7a6bd6',
  blue:   '#5a7fb8',
  teal:   '#3d8a8a',

  // Extended categorical — for category breakdowns when 7 isn't enough
  mustard: '#b89535',
  sage:    '#6b8a52',
  plum:    '#9a5fa8',
  rose:    '#c45a82',
  slate:   '#6b7a85',

  // Soft alpha versions for pills/backgrounds
  terraSoft:  'rgba(198,107,70,0.10)',
  terraSoftStrong: 'rgba(198,107,70,0.16)',
  forestSoft: 'rgba(61,107,84,0.10)',
  redSoft:    'rgba(184,73,47,0.10)',
  amberSoft:  'rgba(201,138,58,0.12)',

  // Type
  font:    '"Geist", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  mono:    '"Geist Mono", ui-monospace, monospace',
  // Tabular numerals for finance — used inline via fontVariantNumeric

  // Geometry
  radius:   12,
  radiusLg: 18,

  // Card elevation — soft shadow gives the cards a bit of lift off the cream
  cardShadow: '0 1px 2px rgba(60,40,20,0.04), 0 4px 14px rgba(60,40,20,0.04)',
};

const twilightTheme = {
  mode: 'dark',

  // Backgrounds — soft warm-dark, not pure black
  bg: '#15151a',
  bgAlt: '#101015',
  surface: '#1e1e24',
  surfaceAlt: '#262630',

  border: 'rgba(255,255,255,0.06)',
  borderStrong: 'rgba(255,255,255,0.10)',

  ink: '#f0ece3',
  inkMuted: '#9c948a',
  inkFaint: '#6b645c',

  terra:  '#e89072',
  forest: '#7ec99c',
  red:    '#e0826b',
  amber:  '#e8b878',
  violet: '#a89be8',
  blue:   '#8aa8d6',
  teal:   '#7ec5c5',

  mustard: '#d4b568',
  sage:    '#a8c590',
  plum:    '#c590d0',
  rose:    '#e890b0',
  slate:   '#a0adb8',

  terraSoft:       'rgba(232,144,114,0.15)',
  terraSoftStrong: 'rgba(232,144,114,0.22)',
  forestSoft:      'rgba(126,201,156,0.14)',
  redSoft:         'rgba(224,130,107,0.14)',
  amberSoft:       'rgba(232,184,120,0.14)',

  font: '"Geist", system-ui, sans-serif',
  mono: '"Geist Mono", ui-monospace, monospace',

  radius:   12,
  radiusLg: 18,

  cardShadow: '0 1px 2px rgba(0,0,0,0.3), 0 4px 14px rgba(0,0,0,0.18)',
};

// Helper: resolve a palette key against the active theme
function paletteColor(theme, key) {
  return theme[key] || key;
}

function CozyShell({ active, children, theme = cozyTheme }) {
  const nav = [
    { key: 'networth',     label: 'Net Worth',    icon: NetWorthIcon },
    { key: 'dashboard',    label: 'Dashboard',    icon: DashboardIcon },
    { key: 'transactions', label: 'Transactions', icon: TransactionsIcon },
    { key: 'import',       label: 'Import',       icon: ImportIcon },
    { key: 'settings',     label: 'Settings',     icon: SettingsIcon },
  ];

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      height: '100%',
      background: theme.bg,
      color: theme.ink,
      fontFamily: theme.font,
      fontFeatureSettings: '"ss01","cv11"',
      fontSize: 14,
      lineHeight: 1.5,
    }}>
      {/* Sidebar — warm cream strip, no border */}
      <aside style={{
        width: 232,
        flex: '0 0 232px',
        padding: '22px 12px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        background: theme.bg,
      }}>
        {/* Brand */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 12px 22px',
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 10,
            background: theme.terra,
            display: 'grid', placeItems: 'center',
            color: '#fff', fontWeight: 600, fontSize: 14,
            boxShadow: '0 2px 6px rgba(198,107,70,0.25)',
          }}>F</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14.5, letterSpacing: '-0.01em', color: theme.ink, whiteSpace: 'nowrap' }}>Finance Hub</div>
            <div style={{ fontSize: 11.5, color: theme.inkFaint, marginTop: -2, whiteSpace: 'nowrap' }}>Personal</div>
          </div>
        </div>

        <SidebarLabel theme={theme}>Overview</SidebarLabel>

        {nav.slice(0, 3).map(n => (
          <NavItem key={n.key} item={n} active={n.key === active} theme={theme} />
        ))}

        <SidebarLabel theme={theme} style={{ marginTop: 18 }}>Manage</SidebarLabel>

        {nav.slice(3).map(n => (
          <NavItem key={n.key} item={n} active={n.key === active} theme={theme} />
        ))}

        <div style={{ marginTop: 'auto', padding: '0 6px' }}>
          {/* Theme toggle */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: 3, borderRadius: 999,
            background: theme.surfaceAlt,
            marginBottom: 12,
          }}>
            <ToggleHalf theme={theme} active={theme.mode === 'light'} icon="☀" label="Light" />
            <ToggleHalf theme={theme} active={theme.mode === 'dark'}  icon="☾" label="Dark" />
          </div>

          {/* User chip */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px',
            borderRadius: 12,
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            boxShadow: theme.cardShadow,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: `linear-gradient(135deg, ${theme.terra}, ${theme.forest})`,
              color: '#fff',
              display: 'grid', placeItems: 'center',
              fontSize: 11, fontWeight: 600,
            }}>EM</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: theme.ink }}>Emma</div>
              <div style={{ fontSize: 11, color: theme.inkFaint }}>emma@hub.dev</div>
            </div>
            <div style={{ color: theme.inkFaint, fontSize: 14 }}>⌄</div>
          </div>
        </div>
      </aside>

      {/* Main — cards float on the cream; subtle line on the left edge */}
      <main style={{
        flex: 1, minWidth: 0,
        background: theme.bg,
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {children}
      </main>
    </div>
  );
}

function SidebarLabel({ children, theme, style }) {
  return (
    <div style={{
      fontSize: 10.5, color: theme.inkFaint,
      textTransform: 'uppercase', letterSpacing: '0.1em',
      fontWeight: 500,
      padding: '6px 14px 6px',
      ...style,
    }}>{children}</div>
  );
}

function NavItem({ item, active, theme }) {
  const Icon = item.icon;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 12px',
      borderRadius: 10,
      background: active ? theme.surface : 'transparent',
      color: active ? theme.ink : theme.inkMuted,
      fontWeight: active ? 500 : 400,
      fontSize: 13.5,
      cursor: 'pointer',
      boxShadow: active ? theme.cardShadow : 'none',
      border: active ? `1px solid ${theme.border}` : '1px solid transparent',
      transition: 'background 0.12s',
    }}>
      <Icon color={active ? theme.terra : theme.inkMuted} size={16} />
      <span style={{ flex: '1 1 auto', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
      {active && (
        <div style={{
          marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%',
          background: theme.terra,
        }} />
      )}
    </div>
  );
}

function ToggleHalf({ theme, active, icon, label }) {
  return (
    <div style={{
      flex: 1,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 5, padding: '5px 8px',
      borderRadius: 999,
      background: active ? theme.surface : 'transparent',
      color: active ? theme.ink : theme.inkMuted,
      fontSize: 11.5, fontWeight: 500,
      boxShadow: active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
      cursor: 'pointer',
    }}>
      <span style={{ fontSize: 12 }}>{icon}</span>
      {label}
    </div>
  );
}

// ── Stroke icons ──────────────────────────────────────────────────────
const Icon = ({ children, color, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
       stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
       style={{ width: size, height: size, flexShrink: 0, display: 'block' }}>
    {children}
  </svg>
);
const NetWorthIcon = (p) => <Icon {...p}><path d="M3 13h10M5 13V8M8 13V4M11 13V9" /></Icon>;
const DashboardIcon = (p) => <Icon {...p}><rect x="2.5" y="2.5" width="5" height="5" rx="1"/><rect x="8.5" y="2.5" width="5" height="5" rx="1"/><rect x="2.5" y="8.5" width="5" height="5" rx="1"/><rect x="8.5" y="8.5" width="5" height="5" rx="1"/></Icon>;
const TransactionsIcon = (p) => <Icon {...p}><path d="M3 5h7l-2-2M13 11H6l2 2" /></Icon>;
const ImportIcon = (p) => <Icon {...p}><path d="M8 2v8M5 7l3 3 3-3M3 13h10" /></Icon>;
const SettingsIcon = (p) => <Icon {...p}><circle cx="8" cy="8" r="2" /><path d="M8 1v2M8 13v2M15 8h-2M3 8H1M13 3l-1.4 1.4M4.4 11.6L3 13M13 13l-1.4-1.4M4.4 4.4L3 3" /></Icon>;

window.CozyShell = CozyShell;
window.cozyTheme = cozyTheme;
window.twilightTheme = twilightTheme;
window.paletteColor = paletteColor;
