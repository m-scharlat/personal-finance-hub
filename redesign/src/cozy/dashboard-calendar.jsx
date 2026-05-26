// Dashboard calendar view component — used as an alternate view of Dashboard.
// Adds 12 month cards in a 4×3 grid with mini income/expense/savings bars.

const DCal = window.FinanceData;
const dcfmt = window.fmt;

// 12 months of data for the calendar grid. Reuses monthlyFlow but adds savings.
const CALENDAR_MONTHS = [
  { m: 'JAN', income: 4597, expense: 1748.92, savings: 500,  state: 'green' },
  { m: 'FEB', income: 4563, expense: 1656.42, savings: 120,  state: 'green' },
  { m: 'MAR', income: 4563, expense: 1636.42, savings: 0,    state: 'green' },
  { m: 'APR', income: 5913, expense: 1956.42, savings: 0,    state: 'green' },
  { m: 'MAY', income: 7,    expense: 156.42,  savings: 250,  state: 'current' },
  { m: 'JUN', income: null, expense: null,    savings: null, state: 'empty' },
  { m: 'JUL', income: null, expense: null,    savings: null, state: 'empty' },
  { m: 'AUG', income: null, expense: null,    savings: null, state: 'empty' },
  { m: 'SEP', income: null, expense: null,    savings: null, state: 'empty' },
  { m: 'OCT', income: null, expense: null,    savings: null, state: 'empty' },
  { m: 'NOV', income: null, expense: null,    savings: null, state: 'empty' },
  { m: 'DEC', income: null, expense: null,    savings: null, state: 'empty' },
];

function CalendarView({ theme }) {
  const maxAmount = Math.max(...CALENDAR_MONTHS.filter(m => m.income != null).map(m => Math.max(m.income, m.expense, m.savings)));

  return (
    <div style={{
      background: theme.surface,
      border: `1px solid ${theme.border}`,
      borderRadius: theme.radiusLg,
      padding: 22,
      boxShadow: theme.cardShadow,
    }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 18, fontSize: 12, color: theme.inkMuted }}>
        <LegendDot color={theme.amber} label="This month" theme={theme} />
        <LegendDot color={theme.forest} label="In the green" theme={theme} />
        <LegendDot color={theme.red} label="In the red" theme={theme} />
        <LegendDot color={theme.inkFaint} label="No data" theme={theme} />
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
      }}>
        {CALENDAR_MONTHS.map((m) => (
          <MonthCell key={m.m} m={m} theme={theme} maxAmount={maxAmount} />
        ))}
      </div>
    </div>
  );
}

function LegendDot({ color, label, theme }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      {label}
    </div>
  );
}

function MonthCell({ m, theme, maxAmount }) {
  const isEmpty = m.state === 'empty';
  const isCurrent = m.state === 'current';
  const net = isEmpty ? 0 : m.income - m.expense;
  const isRed = net < 0;

  // Color the card border/bg based on state
  let cellBg = theme.surface;
  let cellBorder = `1px dashed ${theme.border}`;
  let monthColor = theme.inkFaint;
  let netColor = theme.inkFaint;

  if (isCurrent) {
    cellBg = m.state === 'current' ? theme.amberSoft : theme.surface;
    cellBorder = `1px solid ${theme.amber}`;
    monthColor = theme.amber;
    netColor = isRed ? theme.red : theme.forest;
  } else if (!isEmpty) {
    cellBg = theme.forestSoft;
    cellBorder = `1px solid ${theme.forestSoft.replace(/0\.\d+/, '0.25')}`;
    monthColor = theme.inkMuted;
    netColor = theme.forest;
  }

  return (
    <div style={{
      background: cellBg,
      border: cellBorder,
      borderRadius: theme.radius,
      padding: 14,
      minHeight: 132,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <span style={{
          fontSize: 11, color: monthColor, fontWeight: 600,
          letterSpacing: '0.1em',
        }}>{m.m}</span>
        {!isEmpty && (
          <span style={{
            fontSize: 13, fontWeight: 600, color: netColor,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {net >= 0 ? '+' : ''}{dcfmt.money(net)}
          </span>
        )}
      </div>

      {isEmpty ? (
        <div style={{ fontSize: 13, color: theme.inkFaint, paddingTop: 28, textAlign: 'center' }}>—</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <MiniBar label="Income"     value={m.income}  amountColor={theme.forest} barColor={theme.forest} theme={theme} max={maxAmount} />
          <MiniBar label="Expenses"   value={m.expense} amountColor={theme.red}    barColor={theme.red}    theme={theme} max={maxAmount} />
          <MiniBar label="Net Savings" value={m.savings} amountColor={theme.terra}  barColor={theme.terra}  theme={theme} max={maxAmount} />
        </div>
      )}
    </div>
  );
}

function MiniBar({ label, value, amountColor, barColor, theme, max }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: theme.inkMuted, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: barColor }} />
          {label}
        </span>
        <span style={{ fontSize: 11, fontWeight: 500, color: amountColor, fontVariantNumeric: 'tabular-nums' }}>
          {dcfmt.money(value)}
        </span>
      </div>
      <div style={{ height: 3, borderRadius: 999, background: theme.surfaceAlt, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: barColor, opacity: 0.85, borderRadius: 999,
        }} />
      </div>
    </div>
  );
}

window.CalendarView = CalendarView;
