import re

files = [
    "apps/modit/web/app/products/page.tsx",
    "apps/modit/web/app/products/[id]/page.tsx",
    "apps/modit/web/app/cart/page.tsx",
]

replacements = [
    # Backgrounds - white to dark card
    ('bg-white', 'bg-[var(--bg-card)]'),
    # Brand alias
    ('var(--brand)', 'var(--cyan)'),
    # Image backgrounds
    ('from-orange-50 via-amber-50 to-orange-100', 'from-[#0A0A20] via-[#0D0D25] to-[#100820]'),
    ('from-orange-50 to-amber-50', 'from-[#0A0A20] to-[#0D0D25]'),
    # Focus rings
    ('focus:border-[var(--cyan)] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--cyan)]',
     'focus:border-[var(--cyan)] focus:bg-[var(--bg-elevated)] focus:outline-none focus:ring-2 focus:ring-[rgba(0,240,255,0.15)]'),
    # Badge colors
    ('bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700', 'bg-[rgba(52,211,153,0.1)] px-3 py-1 text-xs font-medium text-[var(--green)]'),
    ('bg-emerald-500 text-white', 'bg-[var(--green)] text-[#050510]'),
    ('bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white', 'bg-[rgba(220,38,38,0.9)] px-2 py-0.5 text-[10px] font-bold text-white'),
    ('bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white', 'bg-[rgba(220,38,38,0.9)] px-1.5 py-0.5 text-[10px] font-bold text-white'),
    ('bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white', 'bg-[rgba(52,211,153,0.2)] px-2 py-0.5 text-[10px] font-bold text-[var(--green)]'),
    # Overlay
    ('bg-black/50', 'bg-black/70'),
    # Accent
    ('accent-[var(--cyan)]', 'accent-[var(--cyan)]'),
    # Focus ring on inputs
    ('focus:ring-1 focus:ring-[var(--cyan)]', 'focus:ring-2 focus:ring-[rgba(0,240,255,0.15)]'),
    # Remove button
    ('hover:bg-red-50', 'hover:bg-[rgba(220,38,38,0.1)]'),
    # Cart buttons
    ('bg-[var(--cyan)] text-white hover:bg-[rgba(0,240,255,0.8)]',
     'bg-[var(--cyan)] text-[#050510] hover:bg-[rgba(0,240,255,0.8)]'),
    # Empty state icon bg
    ('text-[var(--cyan)]/30', 'text-[var(--cyan)]/20'),
]

for filepath in files:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        for old, new in replacements:
            content = content.replace(old, new)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"Updated: {filepath}")
    except Exception as e:
        print(f"Error with {filepath}: {e}")
