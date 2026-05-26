// Transactions — works with both Cozy (light) and Twilight (dark) themes.

const CT = window.FinanceData;
const tfmt = window.fmt;

function CozyTransactions({ theme = window.cozyTheme }) {
  const NWHeader = window.NWHeader;

  return (
    <window.CozyShell active="transactions" theme={theme}>
      <NWHeader
        theme={theme}
        title="Transactions"
        subtitle="Log and manage your income, expenses, and savings."
        right={
          <button style={{
            background: theme.terra, color: '#fff',
            border: 'none', borderRadius: 10,
            padding: '9px 14px', fontSize: 13, fontWeight: 500,
            fontFamily: 'inherit', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: `0 1px 2px rgba(0,0,0,0.05), 0 4px 14px ${theme.terraSoftStrong}`,
          }}>
            <span style={{ fontSize: 14, lineHeight: 1 }}>+</span> Add Transaction
          </button>
        }
      />

      <div style={{ flex: 1, overflow: 'auto', padding: '0 36px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Filters bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: 10,
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: theme.radius,
          flexWrap: 'wrap',
          boxShadow: theme.cardShadow,
        }}>
          <FilterField theme={theme} label="Year"  value="All" />
          <FilterField theme={theme} label="Month" value="All" />
          <div style={{ display: 'flex', gap: 4, marginLeft: 4 }}>
            <CircBtn theme={theme}>‹</CircBtn>
            <CircBtn theme={theme}>›</CircBtn>
          </div>
          <div style={{ width: 1, height: 22, background: theme.border, margin: '0 4px' }} />
          <Chip theme={theme}>This Year</Chip>
          <Chip theme={theme}>This Month</Chip>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <Chip theme={theme} active>All</Chip>
            <Chip theme={theme}>Expense</Chip>
            <Chip theme={theme}>Income</Chip>
            <Chip theme={theme}>Savings</Chip>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '0 4px' }}>
          <Tab theme={theme} active>Transactions <span style={{ color: theme.inkFaint, fontWeight: 400, marginLeft: 4 }}>· 247</span></Tab>
          <Tab theme={theme}>Summary</Tab>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', fontSize: 12.5, color: theme.inkMuted }}>
            <SearchBox theme={theme} />
            <Chip theme={theme}>☐ Select</Chip>
          </div>
        </div>

        {/* Table */}
        <div style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: theme.radiusLg,
          overflow: 'hidden',
          boxShadow: theme.cardShadow,
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '140px 110px 1fr 160px 1.4fr',
            columnGap: 20,
            padding: '13px 22px',
            fontSize: 11, color: theme.inkMuted, fontWeight: 500,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            borderBottom: `1px solid ${theme.border}`,
            background: theme.surfaceAlt,
          }}>
            <div>Date ↕</div>
            <div>Type</div>
            <div>Category</div>
            <div style={{ textAlign: 'right' }}>Amount</div>
            <div>Note</div>
          </div>
          {CT.transactions.map((t, i) => (
            <TxnRow key={i} t={t} theme={theme} last={i === CT.transactions.length - 1} />
          ))}
        </div>
      </div>
    </window.CozyShell>
  );
}

function SearchBox({ theme }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '5px 10px', borderRadius: 999,
      background: theme.surface, border: `1px solid ${theme.border}`,
      fontSize: 12, color: theme.inkFaint, width: 180,
    }}>
      <span style={{ fontSize: 11, opacity: 0.7 }}>⌕</span>
      <span>Search transactions…</span>
      <span style={{ marginLeft: 'auto', padding: '1px 5px', borderRadius: 4, background: theme.surfaceAlt, fontFamily: theme.mono, fontSize: 10.5, color: theme.inkMuted }}>⌘K</span>
    </div>
  );
}

function FilterField({ theme, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, color: theme.inkMuted }}>{label}</span>
      <div style={{
        padding: '6px 10px', borderRadius: 8,
        background: theme.bg, border: `1px solid ${theme.border}`,
        fontSize: 12.5, color: theme.ink, display: 'flex', alignItems: 'center', gap: 8,
        minWidth: 70,
      }}>
        {value} <span style={{ color: theme.inkFaint, marginLeft: 'auto' }}>⌄</span>
      </div>
    </div>
  );
}

function CircBtn({ theme, children }) {
  return (
    <button style={{
      width: 26, height: 26, borderRadius: 7,
      border: `1px solid ${theme.border}`, background: theme.bg,
      color: theme.inkMuted, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
    }}>{children}</button>
  );
}

function Chip({ theme, children, active }) {
  return (
    <button style={{
      padding: '6px 12px', borderRadius: 999,
      background: active ? theme.ink : 'transparent',
      color: active ? theme.bg : theme.inkMuted,
      border: active ? 'none' : `1px solid ${theme.border}`,
      fontSize: 12.5, fontFamily: 'inherit', fontWeight: 500, cursor: 'pointer',
    }}>{children}</button>
  );
}

function Tab({ theme, children, active }) {
  return (
    <button style={{
      background: 'transparent', border: 'none', padding: '6px 0',
      fontSize: 14, color: active ? theme.terra : theme.inkMuted,
      fontWeight: active ? 500 : 400, cursor: 'pointer', fontFamily: 'inherit',
      borderBottom: active ? `2px solid ${theme.terra}` : '2px solid transparent',
    }}>{children}</button>
  );
}

function TypeBadge({ type, theme }) {
  const paletteKey = window.TxnTypeColor[type];
  const map = {
    expense: { bg: theme.redSoft,    fg: theme.red,    label: 'Expense' },
    income:  { bg: theme.forestSoft, fg: theme.forest, label: 'Income' },
    savings: { bg: theme.terraSoft,  fg: theme.terra,  label: 'Savings' },
  };
  const s = map[type];
  return (
    <span style={{
      padding: '2px 9px', borderRadius: 999,
      background: s.bg, color: s.fg,
      fontSize: 11.5, fontWeight: 500,
      display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.fg, opacity: 0.7 }} />
      {s.label}
    </span>
  );
}

function RecurrenceBadge({ t, theme }) {
  if (!t.recurrence) return null;
  const isSplit = t.recurrence === 'split';
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 6,
      background: isSplit ? theme.amberSoft : theme.terraSoft,
      color: isSplit ? theme.amber : theme.terra,
      fontSize: 10.5, fontWeight: 500, fontFamily: theme.mono,
      display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      <span style={{ fontSize: 10 }}>{isSplit ? '÷' : '↻'}</span>
      {isSplit ? `${t.recSplit}mo split` : `${t.recurrence} ×${t.recCount}`}
    </span>
  );
}

function TxnRow({ t, theme, last }) {
  const amtColor = t.type === 'expense' ? theme.red : (t.type === 'savings' ? theme.terra : theme.forest);
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '140px 110px 1fr 160px 1.4fr',
      columnGap: 20,
      padding: '14px 22px',
      alignItems: 'center',
      borderBottom: last ? 'none' : `1px solid ${theme.border}`,
      fontSize: 13.5,
    }}>
      <div style={{ color: theme.ink, fontVariantNumeric: 'tabular-nums' }}>{t.date}</div>
      <div><TypeBadge type={t.type} theme={theme} /></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: theme.ink, minWidth: 0 }}>
        <span style={{ whiteSpace: 'nowrap' }}>{t.category}</span>
        <RecurrenceBadge t={t} theme={theme} />
      </div>
      <div style={{
        textAlign: 'right', fontVariantNumeric: 'tabular-nums',
        fontWeight: 500, color: amtColor,
      }}>{tfmt.money(t.amount, { sign: t.type !== 'expense' })}</div>
      <div style={{ color: t.note ? theme.inkMuted : theme.inkFaint, fontSize: 13 }}>{t.note || '—'}</div>
    </div>
  );
}

window.CozyTransactions = CozyTransactions;
