// Settings — three tabs: Accounts, Categories, Import Mappings

const SD = window.FinanceData;
const sfmt = window.fmt;

const EXPENSE_CATEGORIES = [
  'Rent & Housing', 'Groceries & Pharmacy', 'Car & Transport', 'Therapy',
  'Entertainment', 'Socializing', 'Food & Takeout', 'Shopping',
  'Subscriptions', 'Cat Expenses', 'Other',
];

const INCOME_SOURCES = ['Salary', 'Bonus', 'Other Income', 'Refunds', 'Investment Returns'];

const MAPPINGS = [
  { id: '1', triggers: ['hhp', 'HHP', 'Hebrew Homepage'], category: 'Other Income',  type: 'income'  },
  { id: '2', triggers: ['Google one'],                     category: 'Subscriptions', type: 'expense' },
  { id: '3', triggers: ['tolls (car related)'],            category: 'Transport',     type: 'expense' },
  { id: '4', triggers: ['vitamin D'],                      category: 'Groceries',     type: 'expense' },
  { id: '5', triggers: ['date'],                           category: 'Socializing',   type: 'expense' },
  { id: '6', triggers: ['gas'],                            category: 'Transport',     type: 'expense' },
  { id: '7', triggers: ['disney streaming credit'],        category: 'Other Income',  type: 'income'  },
];

const ACCOUNT_DATES = {
  a1: 'May 12, 2026',
  a2: 'Jul 1, 2026',
  a3: 'May 9, 2026',
  a4: 'May 9, 2026',
  a5: 'May 9, 2026',
  l1: 'May 9, 2026',
  l2: 'May 30, 2026',
  l3: 'May 9, 2026',
};

function CozySettings({ theme = window.cozyTheme, tab = 'accounts' }) {
  const NWHeader = window.NWHeader;
  return (
    <window.CozyShell active="settings" theme={theme}>
      <NWHeader theme={theme} title="Settings" subtitle="Manage your accounts, categories, and import rules." />

      <div style={{ flex: 1, overflow: 'auto', padding: '0 36px 40px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <TabsNav theme={theme} active={tab} />
        {tab === 'accounts'   && <AccountsTab   theme={theme} />}
        {tab === 'categories' && <CategoriesTab theme={theme} />}
        {tab === 'mappings'   && <MappingsTab   theme={theme} />}
      </div>
    </window.CozyShell>
  );
}

function TabsNav({ theme, active }) {
  const tabs = [
    { key: 'accounts',   label: 'Accounts' },
    { key: 'categories', label: 'Categories' },
    { key: 'mappings',   label: 'Import Mappings' },
  ];
  return (
    <div style={{
      display: 'flex', gap: 4,
      padding: 4, borderRadius: 12,
      background: theme.surfaceAlt,
      alignSelf: 'flex-start',
      border: `1px solid ${theme.border}`,
    }}>
      {tabs.map(t => {
        const isActive = t.key === active;
        return (
          <div key={t.key} style={{
            padding: '7px 14px', borderRadius: 8,
            background: isActive ? theme.surface : 'transparent',
            color: isActive ? theme.ink : theme.inkMuted,
            fontSize: 13, fontWeight: isActive ? 500 : 400,
            cursor: 'pointer',
            boxShadow: isActive ? theme.cardShadow : 'none',
            border: isActive ? `1px solid ${theme.border}` : '1px solid transparent',
          }}>{t.label}</div>
        );
      })}
    </div>
  );
}

// ── ACCOUNTS TAB ──────────────────────────────────────────────────────
function AccountsTab({ theme }) {
  const NWCard = window.NWCard;
  const NWLabel = window.NWLabel;
  const assets = SD.accounts.filter(a => a.kind === 'asset');
  const liabilities = SD.accounts.filter(a => a.kind === 'liability');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <SectionHeader
        theme={theme}
        title="Accounts"
        subtitle="Track assets and liabilities that make up your net worth."
        action={<AddBtn theme={theme}>+ Add Account</AddBtn>}
      />

      <div>
        <NWLabel theme={theme}>Assets · 5 accounts</NWLabel>
        <NWCard theme={theme} padding={0} style={{ marginTop: 10 }}>
          {assets.map((a, i) => (
            <AccountSettingRow key={a.id} a={a} theme={theme} last={i === assets.length - 1} />
          ))}
        </NWCard>
      </div>

      <div>
        <NWLabel theme={theme}>Liabilities · 3 accounts</NWLabel>
        <NWCard theme={theme} padding={0} style={{ marginTop: 10 }}>
          {liabilities.map((a, i) => (
            <AccountSettingRow key={a.id} a={a} theme={theme} last={i === liabilities.length - 1} />
          ))}
        </NWCard>
      </div>
    </div>
  );
}

function AccountSettingRow({ a, theme, last }) {
  const color = theme[window.AccountTypeColor[a.accountType]];
  const date = ACCOUNT_DATES[a.id];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 22px',
      borderBottom: last ? 'none' : `1px solid ${theme.border}`,
    }}>
      <DragHandle theme={theme} />
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flex: '0 0 auto' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: theme.ink }}>{a.name}</span>
          <TypePill theme={theme} type={a.accountType} subtype={a.subtype} />
          {a.paidOff && (
            <span style={{
              fontSize: 11, color: theme.forest,
              padding: '2px 8px', borderRadius: 999, background: theme.forestSoft, fontWeight: 500,
            }}>Paid off ✓</span>
          )}
        </div>
        <div style={{ fontSize: 12, color: theme.inkFaint, marginTop: 3 }}>
          <span style={{ fontVariantNumeric: 'tabular-nums', color: theme.inkMuted, fontWeight: 500 }}>
            {sfmt.money(Math.abs(a.balance))}
          </span>
          {' '}as of {date}
          {a.paidOff && <span style={{ marginLeft: 8, color: theme.terra, cursor: 'pointer', fontWeight: 500 }}>· Close account →</span>}
        </div>
      </div>
      <button style={{
        padding: '6px 12px', borderRadius: 8,
        background: 'transparent', border: `1px solid ${theme.terraSoftStrong}`,
        color: theme.terra, fontSize: 12.5, fontWeight: 500,
        fontFamily: 'inherit', cursor: 'pointer',
      }}>Log Balance</button>
      <IconBtn theme={theme}><EditIcon /></IconBtn>
      <IconBtn theme={theme} danger><TrashIcon /></IconBtn>
    </div>
  );
}

function TypePill({ theme, type, subtype }) {
  const colorKey = window.AccountTypeColor[type];
  const color = theme[colorKey];
  const bg = colorKey === 'red' ? theme.redSoft : (theme[colorKey + 'Soft'] || `${color}1f`);
  return (
    <span style={{
      padding: '2px 9px', borderRadius: 999,
      background: bg, color,
      fontSize: 11, fontWeight: 500,
    }}>{subtype}</span>
  );
}

// ── CATEGORIES TAB ────────────────────────────────────────────────────
function CategoriesTab({ theme }) {
  const NWCard = window.NWCard;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <SectionHeader
        theme={theme}
        title="Categories"
        subtitle="Organize transactions with categories and income sources."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <NWCard theme={theme} padding={0}>
          <SubcardHeader theme={theme} title="Expense Categories" count={EXPENSE_CATEGORIES.length} dotColor={theme.red} />
          {EXPENSE_CATEGORIES.map((c, i) => (
            <SettingsCategoryRow key={c} name={c} theme={theme} last={i === EXPENSE_CATEGORIES.length - 1} type="expense" />
          ))}
        </NWCard>

        <NWCard theme={theme} padding={0}>
          <SubcardHeader theme={theme} title="Income Sources" count={INCOME_SOURCES.length} dotColor={theme.forest} />
          {INCOME_SOURCES.map((c, i) => (
            <SettingsCategoryRow key={c} name={c} theme={theme} last={i === INCOME_SOURCES.length - 1} type="income" />
          ))}
          <div style={{
            padding: '14px 22px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 6, fontSize: 12.5, color: theme.terra,
            fontWeight: 500, cursor: 'pointer',
            borderTop: `1px dashed ${theme.border}`,
          }}>
            <span style={{ fontSize: 13 }}>+</span> Add income source
          </div>
        </NWCard>
      </div>
    </div>
  );
}

function SubcardHeader({ theme, title, count, dotColor }) {
  return (
    <div style={{
      padding: '14px 22px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: `1px solid ${theme.border}`,
      background: theme.surfaceAlt,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor }} />
        <span style={{ fontSize: 13.5, fontWeight: 500, color: theme.ink }}>{title}</span>
        <span style={{ fontSize: 11.5, color: theme.inkFaint }}>{count}</span>
      </div>
      <AddBtn theme={theme} small>+ Add</AddBtn>
    </div>
  );
}

function SettingsCategoryRow({ name, theme, last, type }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '11px 22px',
      borderBottom: last ? 'none' : `1px solid ${theme.border}`,
    }}>
      <DragHandle theme={theme} />
      <span style={{
        width: 22, height: 22, borderRadius: 6,
        background: type === 'income' ? theme.forestSoft : theme.redSoft,
        color: type === 'income' ? theme.forest : theme.red,
        display: 'grid', placeItems: 'center',
        fontSize: 11, fontWeight: 600, flexShrink: 0,
      }}>{name.charAt(0)}</span>
      <span style={{ flex: 1, fontSize: 13.5, color: theme.ink }}>{name}</span>
      <IconBtn theme={theme}><EditIcon /></IconBtn>
      <IconBtn theme={theme} danger><TrashIcon /></IconBtn>
    </div>
  );
}

// ── MAPPINGS TAB ──────────────────────────────────────────────────────
function MappingsTab({ theme }) {
  const NWCard = window.NWCard;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <SectionHeader
        theme={theme}
        title="Import Mappings"
        subtitle="Auto-categorize incoming entries when a trigger phrase matches a note."
      />

      {/* Add Mapping form */}
      <NWCard theme={theme}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: theme.ink }}>Add mapping</h3>
        </div>
        <div style={{ fontSize: 12.5, color: theme.inkMuted, marginBottom: 18 }}>
          When any trigger phrase exactly matches an import note (case-insensitive), it auto-fills the category and type.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontSize: 12.5, color: theme.ink, fontWeight: 500 }}>Trigger phrases</span>
              <span style={{ fontSize: 11.5, color: theme.inkFaint, fontFamily: theme.mono }}>Enter or , to add each</span>
            </div>
            <div style={{
              padding: '8px 10px', borderRadius: theme.radius,
              border: `1px solid ${theme.border}`,
              background: theme.surface,
              minHeight: 36,
              display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
            }}>
              <TriggerChip theme={theme}>netflix</TriggerChip>
              <TriggerChip theme={theme}>NFLX</TriggerChip>
              <TriggerChip theme={theme}>Netflix Inc</TriggerChip>
              <span style={{ color: theme.inkFaint, fontSize: 13, padding: '4px 2px' }}>|</span>
              <span style={{ color: theme.inkFaint, fontSize: 12.5, fontStyle: 'italic' }}>e.g. spotify, SPOT…</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, color: theme.ink, fontWeight: 500, marginBottom: 6 }}>Type</div>
              <div style={{
                padding: '8px 12px', borderRadius: 8,
                background: theme.surface, border: `1px solid ${theme.border}`,
                fontSize: 13, color: theme.ink, display: 'flex', alignItems: 'center',
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', background: theme.red, marginRight: 8,
                }} />
                Expense
                <span style={{ marginLeft: 'auto', color: theme.inkFaint, fontSize: 11 }}>⌄</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, color: theme.ink, fontWeight: 500, marginBottom: 6 }}>Category</div>
              <div style={{
                padding: '8px 12px', borderRadius: 8,
                background: theme.surface, border: `1px solid ${theme.border}`,
                fontSize: 13, color: theme.ink, display: 'flex', alignItems: 'center',
              }}>
                Car & Transport
                <span style={{ marginLeft: 'auto', color: theme.inkFaint, fontSize: 11 }}>⌄</span>
              </div>
            </div>
            <button style={{
              background: theme.terra, color: '#fff',
              border: 'none', borderRadius: 10,
              padding: '10px 18px', fontSize: 13, fontWeight: 500,
              fontFamily: 'inherit', cursor: 'pointer',
              boxShadow: `0 1px 2px rgba(0,0,0,0.05), 0 4px 14px ${theme.terraSoftStrong}`,
            }}>Save mapping</button>
          </div>
        </div>
      </NWCard>

      {/* Saved Mappings */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: theme.ink }}>Saved mappings <span style={{ color: theme.inkFaint, fontWeight: 400, fontSize: 14 }}>· {MAPPINGS.length}</span></h3>
          <div style={{ display: 'flex', gap: 6, fontSize: 12, color: theme.inkMuted }}>
            <span style={{ padding: '4px 10px', borderRadius: 999, background: theme.surface, border: `1px solid ${theme.border}` }}>All</span>
            <span style={{ padding: '4px 10px', borderRadius: 999, color: theme.inkMuted }}>Expense</span>
            <span style={{ padding: '4px 10px', borderRadius: 999, color: theme.inkMuted }}>Income</span>
          </div>
        </div>
        <NWCard theme={theme} padding={0}>
          {MAPPINGS.map((m, i) => (
            <MappingRow key={m.id} m={m} theme={theme} last={i === MAPPINGS.length - 1} />
          ))}
        </NWCard>
      </div>
    </div>
  );
}

function MappingRow({ m, theme, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '13px 22px',
      borderBottom: last ? 'none' : `1px solid ${theme.border}`,
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, flex: '0 0 auto', maxWidth: '40%' }}>
        {m.triggers.map(t => <TriggerChip key={t} theme={theme}>{t}</TriggerChip>)}
      </div>
      <span style={{ color: theme.inkFaint, fontSize: 13 }}>→</span>
      <span style={{ fontSize: 13.5, color: theme.ink, fontWeight: 500 }}>{m.category}</span>
      <span style={{
        padding: '2px 9px', borderRadius: 999,
        background: m.type === 'income' ? theme.forestSoft : theme.redSoft,
        color: m.type === 'income' ? theme.forest : theme.red,
        fontSize: 11.5, fontWeight: 500,
        textTransform: 'capitalize',
      }}>{m.type}</span>
      <div style={{ marginLeft: 'auto' }}>
        <IconBtn theme={theme} danger><TrashIcon /></IconBtn>
      </div>
    </div>
  );
}

function TriggerChip({ theme, children }) {
  return (
    <span style={{
      padding: '3px 9px', borderRadius: 6,
      background: 'rgba(122,107,214,0.10)', color: theme.violet,
      fontSize: 12, fontWeight: 500, fontFamily: theme.mono,
      whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

// ── Shared bits ───────────────────────────────────────────────────────
function SectionHeader({ theme, title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme.ink }}>{title}</h2>
        <div style={{ marginTop: 4, fontSize: 13, color: theme.inkMuted }}>{subtitle}</div>
      </div>
      {action}
    </div>
  );
}

function AddBtn({ theme, children, small }) {
  return (
    <button style={{
      background: small ? 'transparent' : theme.terra,
      color: small ? theme.terra : '#fff',
      border: small ? 'none' : 'none',
      borderRadius: 10,
      padding: small ? '4px 10px' : '8px 14px',
      fontSize: 12.5, fontWeight: 500,
      fontFamily: 'inherit', cursor: 'pointer',
      boxShadow: small ? 'none' : `0 1px 2px rgba(0,0,0,0.05), 0 4px 14px ${theme.terraSoftStrong}`,
    }}>{children}</button>
  );
}

function DragHandle({ theme }) {
  return (
    <div style={{
      cursor: 'grab', color: theme.inkFaint,
      display: 'grid', gridTemplateColumns: 'auto auto', gap: 2,
      flex: '0 0 auto',
    }}>
      {[0,1,2,3,4,5].map(i => (
        <span key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: theme.inkFaint, opacity: 0.5 }} />
      ))}
    </div>
  );
}

function IconBtn({ theme, children, danger }) {
  return (
    <button style={{
      width: 28, height: 28,
      borderRadius: 7, border: 'none',
      background: 'transparent',
      color: danger ? theme.red : theme.inkMuted,
      cursor: 'pointer', display: 'grid', placeItems: 'center',
    }}>{children}</button>
  );
}

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0 }}>
    <path d="M11 2l3 3-8.5 8.5H2.5V10.5L11 2z" />
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0 }}>
    <path d="M3 4.5h10M6 4.5V3a1 1 0 011-1h2a1 1 0 011 1v1.5M5 4.5l.8 8.5a1 1 0 001 .9h2.4a1 1 0 001-.9L11 4.5" />
  </svg>
);

window.CozySettings = CozySettings;
