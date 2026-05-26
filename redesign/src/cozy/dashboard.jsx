// Dashboard — works with both Cozy (light) and Twilight (dark) themes.

const CD = window.FinanceData;
const cfmt = window.fmt;

function CozyDashboard({ theme = window.cozyTheme, view = 'trends' }) {
  const NWCard = window.NWCard;
  const NWHeader = window.NWHeader;
  const NWLabel = window.NWLabel;
  const SegBtn = window.NWSegBtn;
  const isCalendar = view === 'calendar';

  return (
    <window.CozyShell active="dashboard" theme={theme}>
      <NWHeader
        theme={theme}
        title="Dashboard"
        subtitle="Your financial overview at a glance."
        right={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <YearStepper theme={theme} />
            <Pill theme={theme}>Full Year <span style={{ marginLeft: 4, color: theme.inkFaint }}>⌄</span></Pill>
          </div>
        }
      />

      <div style={{ flex: 1, overflow: 'auto', padding: '0 36px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <Kpi theme={theme} label="Income"        value={cfmt.money(CD.kpis.income)}                  paletteKey="forest" trend="+8.2% vs last year" />
          <Kpi theme={theme} label="Expenses"      value={cfmt.money(CD.kpis.expenses)}                paletteKey="red"    trend="−3.4% vs last year" trendUp={false} />
          <Kpi theme={theme} label="Net Cash Flow" value={'+' + cfmt.money(CD.kpis.netCashFlow)}       paletteKey="terra"  trend="On track" />
          <Kpi theme={theme} label="Savings Rate"  value={(CD.kpis.savingsRate * 100).toFixed(1) + '%'} paletteKey="amber"  trend="Target 15%" />
        </div>

        {/* Trends / Calendar header */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-0.015em', color: theme.ink }}>
            {isCalendar ? 'Calendar' : 'Trends'}
          </h2>
          <span style={{ color: theme.inkFaint, fontSize: 13 }}>2026</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            <SegBtn theme={theme} active={!isCalendar}>Trends</SegBtn>
            <SegBtn theme={theme} active={isCalendar}>Calendar</SegBtn>
          </div>
        </div>

        {isCalendar ? (
          <window.CalendarView theme={theme} />
        ) : (
          <>

        {/* Charts grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14 }}>
          <NWCard theme={theme}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <NWLabel theme={theme}>Income vs Expenses</NWLabel>
                <div style={{ marginTop: 6, fontSize: 13.5, color: theme.ink, fontWeight: 500 }}>
                  Avg monthly net: <span style={{ color: theme.forest, fontVariantNumeric: 'tabular-nums' }}>+{cfmt.money(2750, { cents: false })}</span>
                </div>
              </div>
              <Legend theme={theme} items={[
                { color: theme.forest, label: 'Income' },
                { color: theme.red, label: 'Expense' },
              ]} />
            </div>
            <BarsChart theme={theme} />
          </NWCard>

          <NWCard theme={theme}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <NWLabel theme={theme}>Spending by Category</NWLabel>
              <button style={{
                background: 'transparent', border: 'none', color: theme.terra,
                fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', padding: 0, fontWeight: 500,
              }}>Show all 11 →</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {CD.categories.slice(0, 5).map((c) => (
                <CategoryRow key={c.name} c={c} theme={theme} />
              ))}
            </div>
          </NWCard>
        </div>

        {/* Bottom row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14 }}>
          <NWCard theme={theme}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <NWLabel theme={theme}>Cumulative Net Savings</NWLabel>
                <div style={{ marginTop: 6, fontSize: 13.5, color: theme.ink, fontWeight: 500 }}>
                  YTD: <span style={{ color: theme.forest, fontVariantNumeric: 'tabular-nums' }}>{cfmt.money(12492, { cents: false })}</span>
                </div>
              </div>
              <Toggle theme={theme} on label="Include logged" />
            </div>
            <CumulativeChart theme={theme} />
          </NWCard>

          <NWCard theme={theme}>
            <NWLabel theme={theme}>Recurring Expenses</NWLabel>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 12 }}>
              <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', color: theme.ink }}>{cfmt.money(CD.recurring.total)}</div>
              <span style={{ color: theme.inkMuted, fontSize: 13 }}>/mo committed</span>
            </div>
            <div style={{ color: theme.inkFaint, fontSize: 12.5, marginTop: 2 }}>{(CD.recurring.pctIncome * 100).toFixed(0)}% of avg monthly income</div>

            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {CD.recurring.items.map(it => (
                <div key={it.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: theme[it.paletteKey] }} />
                    <span style={{ fontSize: 13.5, color: theme.ink }}>{it.name}</span>
                  </div>
                  <span style={{ fontSize: 13.5, color: theme.ink, fontVariantNumeric: 'tabular-nums' }}>
                    {cfmt.money(it.amount)}<span style={{ color: theme.inkFaint }}>/mo</span>
                  </span>
                </div>
              ))}
            </div>
          </NWCard>
        </div>
        </>
        )}
      </div>
    </window.CozyShell>
  );
}

function YearStepper({ theme }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 0,
      border: `1px solid ${theme.border}`,
      borderRadius: 10,
      background: theme.surface,
      padding: 2,
      boxShadow: theme.cardShadow,
    }}>
      <button style={iconBtn(theme)}>‹</button>
      <div style={{ padding: '2px 12px', fontSize: 13, fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: theme.ink }}>2026</div>
      <button style={iconBtn(theme)}>›</button>
    </div>
  );
}
function iconBtn(theme) {
  return {
    width: 22, height: 22, border: 'none', background: 'transparent',
    color: theme.inkMuted, fontSize: 14, cursor: 'pointer',
    borderRadius: 6, fontFamily: 'inherit',
  };
}

function Pill({ theme, children }) {
  return (
    <div style={{
      padding: '6px 12px', borderRadius: 10,
      background: theme.surface, border: `1px solid ${theme.border}`,
      fontSize: 13, fontWeight: 500, color: theme.ink,
      boxShadow: theme.cardShadow,
    }}>{children}</div>
  );
}

function Kpi({ theme, label, value, paletteKey, trend, trendUp = true }) {
  const accent = theme[paletteKey];
  const accentSoft = paletteKey === 'terra' ? theme.terraSoft
                    : paletteKey === 'forest' ? theme.forestSoft
                    : paletteKey === 'red' ? theme.redSoft
                    : paletteKey === 'amber' ? theme.amberSoft
                    : theme.surfaceAlt;
  return (
    <div style={{
      background: theme.surface,
      border: `1px solid ${theme.border}`,
      borderRadius: theme.radiusLg,
      padding: 18,
      position: 'relative',
      overflow: 'hidden',
      boxShadow: theme.cardShadow,
    }}>
      <div>
        <div style={{ fontSize: 11, color: theme.inkMuted, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500 }}>{label}</div>
        <div style={{
          marginTop: 8, fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em',
          color: accent, fontVariantNumeric: 'tabular-nums',
        }}>{value}</div>
        <div style={{ marginTop: 6, fontSize: 12, color: theme.inkFaint }}>
          <span style={{ color: trendUp ? theme.forest : theme.red, fontWeight: 500 }}>{trendUp ? '↗' : '↘'} </span>
          {trend}
        </div>
      </div>
    </div>
  );
}

function Legend({ theme, items }) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      {items.map(i => (
        <div key={i.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: theme.inkMuted }}>
          <span style={{ width: 8, height: 8, borderRadius: 3, background: i.color }} />
          {i.label}
        </div>
      ))}
    </div>
  );
}

function Toggle({ theme, on, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, color: theme.inkMuted }}>{label}</span>
      <div style={{
        width: 32, height: 18, borderRadius: 999,
        background: on ? theme.forest : theme.surfaceAlt,
        position: 'relative', transition: 'background 0.15s',
      }}>
        <div style={{
          position: 'absolute', top: 2, left: on ? 16 : 2,
          width: 14, height: 14, borderRadius: '50%', background: '#fff',
          boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
          transition: 'left 0.15s',
        }} />
      </div>
    </div>
  );
}

function CategoryRow({ c, theme }) {
  const color = theme[c.paletteKey];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
          <span style={{ fontSize: 13.5, color: theme.ink }}>{c.name}</span>
        </div>
        <span style={{ fontSize: 13.5, fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: theme.ink }}>{cfmt.money(c.amount)}</span>
      </div>
      <div style={{ height: 4, borderRadius: 999, background: theme.surfaceAlt, overflow: 'hidden' }}>
        <div style={{ width: `${c.pct * 100}%`, height: '100%', background: color, opacity: 0.75 }} />
      </div>
    </div>
  );
}

function BarsChart({ theme }) {
  const W = 640, H = 180;
  const padL = 32, padR = 12, padT = 6, padB = 26;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const months = CD.monthlyFlow;
  const maxV = 6000;
  const xStep = innerW / months.length;
  const barW = 9, gap = 3;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      {[0, 2000, 4000, 6000].map(t => {
        const y = padT + innerH - (t / maxV) * innerH;
        return (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y} y2={y} stroke={theme.border} strokeDasharray={t === 0 ? '0' : '3 4'} />
            <text x={padL - 6} y={y + 3} fontSize="9.5" textAnchor="end" fill={theme.inkFaint} fontFamily={theme.font}>{cfmt.yTick(t)}</text>
          </g>
        );
      })}
      {months.map((m, i) => {
        const x = padL + i * xStep + xStep / 2;
        const ih = (m.income / maxV) * innerH;
        const eh = (m.expense / maxV) * innerH;
        const partial = m.partial;
        return (
          <g key={m.m}>
            {m.income > 0 && (
              <rect
                x={x - barW - gap / 2}
                y={padT + innerH - ih}
                width={barW}
                height={ih}
                fill={theme.forest}
                opacity={partial ? 0.35 : 0.92}
                rx={2.5}
              />
            )}
            {m.expense > 0 && (
              <rect
                x={x + gap / 2}
                y={padT + innerH - eh}
                width={barW}
                height={eh}
                fill={theme.red}
                opacity={partial ? 0.35 : 0.88}
                rx={2.5}
              />
            )}
            <text x={x} y={H - 8} fontSize="10" textAnchor="middle" fill={partial || m.income === 0 ? theme.inkFaint : theme.inkMuted} fontFamily={theme.font}>{m.m}</text>
          </g>
        );
      })}
    </svg>
  );
}

function CumulativeChart({ theme }) {
  const W = 640, H = 180;
  const padL = 36, padR = 12, padT = 6, padB = 26;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const data = CD.cumulativeSavings;
  const maxV = 16000;
  const xStep = innerW / (data.length - 1);
  const pts = data.map((d, i) => ({
    x: padL + i * xStep,
    y: padT + innerH - (d.v / maxV) * innerH,
  }));
  const path = pts.reduce((acc, p, i) => {
    if (i === 0) return `M${p.x},${p.y}`;
    const prev = pts[i - 1];
    const cpx = (prev.x + p.x) / 2;
    return `${acc} C${cpx},${prev.y} ${cpx},${p.y} ${p.x},${p.y}`;
  }, '');
  const area = `${path} L${pts[pts.length - 1].x},${padT + innerH} L${pts[0].x},${padT + innerH} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="cumArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={theme.forest} stopOpacity="0.22" />
          <stop offset="100%" stopColor={theme.forest} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 5000, 10000, 15000].map(t => {
        const y = padT + innerH - (t / maxV) * innerH;
        return (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y} y2={y} stroke={theme.border} strokeDasharray={t === 0 ? '0' : '3 4'} />
            <text x={padL - 6} y={y + 3} fontSize="9.5" textAnchor="end" fill={theme.inkFaint} fontFamily={theme.font}>{cfmt.yTick(t)}</text>
          </g>
        );
      })}
      <path d={area} fill="url(#cumArea)" />
      <path d={path} fill="none" stroke={theme.forest} strokeWidth="2.25" strokeLinecap="round" />
      {data.map((d, i) => (
        <text key={d.m} x={pts[i].x} y={H - 8} fontSize="10" textAnchor="middle" fill={theme.inkMuted} fontFamily={theme.font}>{d.m}</text>
      ))}
    </svg>
  );
}

window.CozyDashboard = CozyDashboard;
