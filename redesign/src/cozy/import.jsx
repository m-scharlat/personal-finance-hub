// Import — paste your notes-app expense list to bulk import a month.

function CozyImport({ theme = window.cozyTheme }) {
  const NWHeader = window.NWHeader;
  const NWCard = window.NWCard;
  const NWLabel = window.NWLabel;

  return (
    <window.CozyShell active="import" theme={theme}>
      <NWHeader
        theme={theme}
        title="Import Transactions"
        subtitle="Paste a notes-app expense list to bulk import a month of transactions."
      />

      <div style={{ flex: 1, overflow: 'auto', padding: '0 36px 40px', display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
        {/* Left — input */}
        <NWCard theme={theme} padding={0}>
          <div style={{ padding: '20px 22px', borderBottom: `1px solid ${theme.border}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
              <FieldGroup theme={theme} label="Month">
                <Select theme={theme} value="May" />
              </FieldGroup>
              <FieldGroup theme={theme} label="Year">
                <Select theme={theme} value="2026" />
              </FieldGroup>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: theme.inkFaint }}>Importing into</span>
                <span style={{
                  padding: '5px 10px', borderRadius: 999,
                  background: theme.terraSoft, color: theme.terra,
                  fontSize: 12, fontWeight: 500,
                }}>May 2026</span>
              </div>
            </div>
          </div>

          <div style={{ padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
              <NWLabel theme={theme}>Paste your notes</NWLabel>
              <button style={{
                background: 'transparent', border: 'none', color: theme.terra,
                fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', padding: 0, fontWeight: 500,
              }}>Clear</button>
            </div>

            {/* Textarea with mono font and faint placeholder syntax */}
            <div style={{
              border: `1px solid ${theme.border}`,
              borderRadius: theme.radius,
              padding: 14,
              minHeight: 260,
              background: theme.surfaceAlt,
              fontFamily: theme.mono,
              fontSize: 13,
              color: theme.inkFaint,
              position: 'relative',
            }}>
              <div style={{ lineHeight: 1.7 }}>
                <PlaceholderLine theme={theme} sign="−" amount="25"   text="food at noodle bar" />
                <PlaceholderLine theme={theme} sign="−" amount="100"  text="amazon" />
                <PlaceholderLine theme={theme} sign="−" amount="14.50" text="netflix" />
                <PlaceholderLine theme={theme} sign="+" amount="2400" text="salary" />
                <PlaceholderLine theme={theme} sign="→" amount="500"  text="hysa transfer" income={false} savings />
              </div>
              {/* Caret */}
              <span style={{
                display: 'inline-block', width: 1.5, height: 14,
                background: theme.terra, marginLeft: 2,
                verticalAlign: 'middle',
                animation: 'none',
              }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
              <button style={{
                background: theme.terra, color: '#fff',
                border: 'none', borderRadius: 10,
                padding: '10px 18px', fontSize: 13, fontWeight: 500,
                fontFamily: 'inherit', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: `0 1px 2px rgba(0,0,0,0.05), 0 4px 14px ${theme.terraSoftStrong}`,
              }}>
                Parse transactions <span>→</span>
              </button>
              <div style={{ fontSize: 12, color: theme.inkFaint }}>
                We'll auto-categorize known entries from your saved mappings.
              </div>
            </div>
          </div>
        </NWCard>

        {/* Right — syntax + preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <NWCard theme={theme}>
            <NWLabel theme={theme}>Syntax</NWLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
              <SyntaxRow theme={theme} sigil="−" sigilColor={theme.red}    label="Expense"  example="− 25 food" />
              <SyntaxRow theme={theme} sigil="+" sigilColor={theme.forest} label="Income"   example="+ 2400 salary" />
              <SyntaxRow theme={theme} sigil="→" sigilColor={theme.terra}  label="Savings"  example="→ 500 hysa" />
            </div>
            <div style={{
              marginTop: 16, padding: 12,
              borderRadius: theme.radius,
              background: theme.terraSoft,
              fontSize: 12, color: theme.ink,
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <span style={{
                width: 18, height: 18, borderRadius: '50%',
                background: theme.terra, color: '#fff',
                display: 'grid', placeItems: 'center',
                fontSize: 11, fontWeight: 700, flexShrink: 0,
              }}>i</span>
              <span>You can add several entries per line, separate with commas. Decimal points and currency symbols are optional.</span>
            </div>
          </NWCard>

          <NWCard theme={theme}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <NWLabel theme={theme}>Last imports</NWLabel>
              <button style={{
                background: 'transparent', border: 'none', color: theme.terra,
                fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', padding: 0, fontWeight: 500,
              }}>View all</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 12 }}>
              <ImportHistoryRow theme={theme} month="Apr 2026" count={42} amount={1956.42} />
              <ImportHistoryRow theme={theme} month="Mar 2026" count={38} amount={1636.42} />
              <ImportHistoryRow theme={theme} month="Feb 2026" count={35} amount={1656.42} last />
            </div>
          </NWCard>
        </div>
      </div>
    </window.CozyShell>
  );
}

function FieldGroup({ theme, label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, color: theme.inkMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>{label}</span>
      {children}
    </div>
  );
}

function Select({ theme, value }) {
  return (
    <div style={{
      padding: '8px 12px', borderRadius: 8,
      background: theme.surface, border: `1px solid ${theme.border}`,
      fontSize: 13, color: theme.ink, fontFamily: 'inherit',
      display: 'flex', alignItems: 'center', gap: 14,
      minWidth: 110, boxShadow: theme.cardShadow,
    }}>
      {value} <span style={{ marginLeft: 'auto', color: theme.inkFaint, fontSize: 11 }}>⌄</span>
    </div>
  );
}

function PlaceholderLine({ theme, sign, amount, text, savings }) {
  const signColor = sign === '+' ? theme.forest : sign === '→' ? theme.terra : theme.red;
  return (
    <div style={{ display: 'flex', gap: 8, opacity: 0.6 }}>
      <span style={{ color: signColor, fontWeight: 600, width: 14 }}>{sign}</span>
      <span style={{ color: theme.ink, fontWeight: 500, minWidth: 56 }}>{amount}</span>
      <span style={{ color: theme.inkMuted }}>{text}</span>
    </div>
  );
}

function SyntaxRow({ theme, sigil, sigilColor, label, example }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{
        width: 24, height: 24, borderRadius: 6,
        background: sigilColor + '20', color: sigilColor,
        display: 'grid', placeItems: 'center',
        fontFamily: theme.mono, fontWeight: 700, fontSize: 14,
        flexShrink: 0,
      }}>{sigil}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: theme.ink }}>{label}</div>
        <div style={{ fontFamily: theme.mono, fontSize: 11.5, color: theme.inkMuted, marginTop: 1 }}>{example}</div>
      </div>
    </div>
  );
}

function ImportHistoryRow({ theme, month, count, amount, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: last ? 'none' : `1px solid ${theme.border}`,
    }}>
      <div>
        <div style={{ fontSize: 13.5, color: theme.ink, fontWeight: 500 }}>{month}</div>
        <div style={{ fontSize: 11.5, color: theme.inkFaint }}>{count} transactions</div>
      </div>
      <div style={{ fontSize: 13, color: theme.red, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
        −{window.fmt.money(amount)}
      </div>
    </div>
  );
}

window.CozyImport = CozyImport;
