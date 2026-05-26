// Net Worth screen — works with both Cozy (light) and Twilight (dark) themes.

const D = window.FinanceData;
const fmt = window.fmt;

function NWHeader({ theme, title, subtitle, right }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 24,
      padding: '26px 36px 22px',
    }}>
      <div>
        <h1 style={{
          margin: 0,
          fontSize: 26,
          fontWeight: 600,
          letterSpacing: '-0.02em',
          color: theme.ink,
        }}>{title}</h1>
        {subtitle && <div style={{ marginTop: 4, fontSize: 13.5, color: theme.inkMuted }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

function NWCard({ theme, children, style, padding = 24 }) {
  return (
    <div style={{
      background: theme.surface,
      border: `1px solid ${theme.border}`,
      borderRadius: theme.radiusLg,
      boxShadow: theme.cardShadow,
      padding,
      ...style,
    }}>{children}</div>
  );
}

function CozyNetWorth({ theme = window.cozyTheme }) {
  return (
    <window.CozyShell active="networth" theme={theme}>
      <NWHeader
        theme={theme}
        title="Net Worth"
        subtitle="Your overall financial position at a glance."
        right={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <SyncPill theme={theme} />
          </div>
        }
      />

      <div style={{ flex: 1, overflow: 'auto', padding: '0 36px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Hero card — net worth + breakdown */}
        <NWCard theme={theme} padding={0}>
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr' }}>
            {/* Left — total */}
            <div style={{
              padding: 28, borderRight: `1px solid ${theme.border}`,
              display: 'flex', flexDirection: 'column',
              background: `linear-gradient(180deg, ${theme.terraSoft} 0%, transparent 80%)`,
              borderTopLeftRadius: theme.radiusLg,
              borderBottomLeftRadius: theme.radiusLg,
            }}>
              <Label theme={theme}>Net worth</Label>
              <div style={{
                fontSize: 44, fontWeight: 600, letterSpacing: '-0.03em',
                marginTop: 10, fontVariantNumeric: 'tabular-nums', color: theme.ink,
                lineHeight: 1.05,
              }}>{fmt.money(D.netWorth)}</div>
              <div style={{ fontSize: 12.5, color: theme.inkFaint, marginTop: 4 }}>estimated as of today</div>

              <div style={{
                display: 'inline-flex', alignSelf: 'flex-start',
                marginTop: 16, padding: '5px 11px', borderRadius: 999,
                background: theme.forestSoft, color: theme.forest,
                fontSize: 12.5, fontWeight: 500, gap: 5, alignItems: 'center',
                fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
              }}>
                <span style={{ fontSize: 11 }}>↗</span>
                {fmt.money(D.deltaMonth, { sign: true, cents: false })} (+{D.deltaPct}%) this month
              </div>

              <div style={{
                marginTop: 28, borderTop: `1px solid ${theme.border}`, paddingTop: 18,
                display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                <Row label="Assets" value={fmt.money(D.assetsTotal)} valueColor={theme.forest} theme={theme} />
                <Row label="Liabilities" value={fmt.money(D.liabilitiesTotal)} valueColor={theme.red} theme={theme} />
              </div>

              <button style={{
                marginTop: 'auto', alignSelf: 'flex-start',
                background: 'transparent', border: 'none',
                color: theme.terra, fontFamily: 'inherit',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                padding: 0, paddingTop: 28,
              }}>Manage accounts →</button>
            </div>

            {/* Right — Breakdown */}
            <div style={{ padding: '24px 28px' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 16,
              }}>
                <Label theme={theme}>Breakdown</Label>
                <div style={{ display: 'flex', gap: 4 }}>
                  <SegBtn theme={theme} active>Balance</SegBtn>
                  <SegBtn theme={theme}>Allocation</SegBtn>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {D.accounts.map(a => (
                  <AccountRow key={a.id} a={a} theme={theme} />
                ))}
              </div>
            </div>
          </div>
        </NWCard>

        {/* Chart card */}
        <NWCard theme={theme}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div>
              <Label theme={theme}>Net worth over time</Label>
              <div style={{ marginTop: 6, fontSize: 13, color: theme.inkMuted, maxWidth: 480 }}>
                Solid is logged history. Dashed is the projection if current contributions continue.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['History', '1Y', '5Y', '10Y'].map(r => (
                <SegBtn key={r} theme={theme} active={r === '1Y'}>{r}</SegBtn>
              ))}
            </div>
          </div>
          <NetWorthChart theme={theme} />
        </NWCard>
      </div>
    </window.CozyShell>
  );
}

function Label({ children, theme }) {
  return (
    <div style={{
      fontSize: 10.5, color: theme.inkMuted,
      textTransform: 'uppercase', letterSpacing: '0.1em',
      fontWeight: 500,
    }}>{children}</div>
  );
}

function Row({ label, value, valueColor, theme }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ color: theme.inkMuted, fontSize: 13.5 }}>{label}</span>
      <span style={{ color: valueColor || theme.ink, fontWeight: 500, fontVariantNumeric: 'tabular-nums', fontSize: 14 }}>{value}</span>
    </div>
  );
}

function SegBtn({ children, active, theme }) {
  return (
    <button style={{
      padding: '5px 11px',
      borderRadius: 8,
      border: 'none',
      background: active ? theme.surfaceAlt : 'transparent',
      color: active ? theme.ink : theme.inkMuted,
      fontWeight: active ? 500 : 400,
      fontSize: 12.5,
      cursor: 'pointer',
      fontFamily: 'inherit',
    }}>{children}</button>
  );
}

function SyncPill({ theme }) {
  return (
    <div style={{
      padding: '6px 12px', borderRadius: 999,
      background: theme.surface, border: `1px solid ${theme.border}`,
      fontSize: 12.5, color: theme.inkMuted, display: 'flex', gap: 6, alignItems: 'center',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: theme.forest, display: 'inline-block', boxShadow: `0 0 0 3px ${theme.forestSoft}` }} />
      All accounts synced · 16d
    </div>
  );
}

function AccountRow({ a, theme }) {
  const color = theme[window.AccountTypeColor[a.accountType]];
  const isLiab = a.kind === 'liability';
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, minWidth: 0 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flex: '0 0 auto' }} />
        <div style={{
          fontSize: 13.5, fontWeight: 500, color: theme.ink,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0,
        }}>{a.name}</div>
        {a.recurring && (
          <div style={{ fontSize: 11.5, color: theme.forest, fontVariantNumeric: 'tabular-nums', fontWeight: 500, flex: '0 0 auto', whiteSpace: 'nowrap' }}>
            {a.recurring}
          </div>
        )}
        {a.paidOff && (
          <span style={{
            fontSize: 11, color: theme.forest,
            padding: '2px 8px', borderRadius: 999, background: theme.forestSoft, fontWeight: 500,
            display: 'inline-flex', alignItems: 'center', gap: 3, flex: '0 0 auto', whiteSpace: 'nowrap',
          }}>Paid off <span style={{ fontSize: 9 }}>✓</span></span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto' }}>
          {a.est && (
            <span style={{
              fontSize: 10.5, color: theme.inkMuted,
              padding: '1px 6px', borderRadius: 4, background: theme.surfaceAlt, fontWeight: 500,
            }}>est.</span>
          )}
          <div style={{
            fontSize: 14, fontWeight: 500,
            color: a.balance < 0 ? theme.red : theme.ink,
            fontVariantNumeric: 'tabular-nums',
          }}>{fmt.money(a.balance)}</div>
        </div>
      </div>
      <div style={{
        height: 5, borderRadius: 999, background: theme.surfaceAlt,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.min(a.pct * 100, 100)}%`,
          height: '100%',
          background: color,
          opacity: isLiab ? 0.7 : 0.85,
          borderRadius: 999,
        }} />
      </div>
      {a.loggedDays != null && (
        <div style={{ fontSize: 11.5, color: theme.inkFaint, marginTop: 4 }}>logged {a.loggedDays}d ago</div>
      )}
    </div>
  );
}

function NetWorthChart({ theme }) {
  const W = 1080, H = 220;
  const data = D.netWorthHistory;
  const padL = 44, padR = 20, padT = 12, padB = 30;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const minV = 20000, maxV = 80000;
  const xStep = innerW / (data.length - 1);
  const pts = data.map((d, i) => ({
    x: padL + i * xStep,
    y: padT + innerH - ((d.value - minV) / (maxV - minV)) * innerH,
    actual: d.actual,
  }));

  const actualPts = pts.filter(p => p.actual);
  const splitIdx = actualPts.length - 1;
  const projPts = pts.slice(splitIdx);

  const toPath = (arr) => arr.length === 0 ? '' :
    arr.reduce((acc, p, i) => {
      if (i === 0) return `M${p.x},${p.y}`;
      const prev = arr[i - 1];
      const cpx = (prev.x + p.x) / 2;
      return `${acc} C${cpx},${prev.y} ${cpx},${p.y} ${p.x},${p.y}`;
    }, '');

  const actualPath = toPath(actualPts);
  const projPath = toPath(projPts);
  const lastActual = actualPts[actualPts.length - 1];
  const areaPath = `${actualPath} L${lastActual.x},${padT + innerH} L${pts[0].x},${padT + innerH} Z`;
  const projAreaPath = `${projPath} L${pts[pts.length - 1].x},${padT + innerH} L${lastActual.x},${padT + innerH} Z`;

  const yTicks = [20000, 30000, 40000, 50000, 60000, 70000, 80000];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="nwAreaActual" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={theme.terra} stopOpacity="0.22" />
          <stop offset="100%" stopColor={theme.terra} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="nwAreaProj" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={theme.terra} stopOpacity="0.08" />
          <stop offset="100%" stopColor={theme.terra} stopOpacity="0" />
        </linearGradient>
      </defs>
      {yTicks.map(t => {
        const y = padT + innerH - ((t - minV) / (maxV - minV)) * innerH;
        return (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y} y2={y} stroke={theme.border} strokeDasharray={t === minV ? '0' : '3 4'} />
            <text x={padL - 8} y={y + 4} fontSize="10.5" textAnchor="end" fill={theme.inkFaint} fontFamily={theme.font}>
              {fmt.yTick(t)}
            </text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#nwAreaActual)" />
      <path d={projAreaPath} fill="url(#nwAreaProj)" />
      <path d={actualPath} fill="none" stroke={theme.terra} strokeWidth="2.25" strokeLinecap="round" />
      <path d={projPath} fill="none" stroke={theme.terra} strokeWidth="2.25" strokeDasharray="5 6" opacity="0.6" strokeLinecap="round" />
      <circle cx={lastActual.x} cy={lastActual.y} r="5.5" fill={theme.surface} stroke={theme.terra} strokeWidth="2.5" />

      {pts.map((p, i) => i % 3 === 0 && (
        <text key={i} x={p.x} y={H - 10} fontSize="10.5" textAnchor="middle" fill={theme.inkMuted} fontFamily={theme.font}>
          {data[i].month}
        </text>
      ))}
    </svg>
  );
}

window.CozyNetWorth = CozyNetWorth;
window.NWCard = NWCard;
window.NWHeader = NWHeader;
window.NWSegBtn = SegBtn;
window.NWLabel = Label;
