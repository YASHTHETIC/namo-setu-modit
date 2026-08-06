import os

# === SHELL ===
shell_path = "apps/modit/web/components/modit-shell.tsx"
with open(shell_path, 'r', encoding='utf-8') as f:
    s = f.read()

# Replace the entire return block
old_return = '''    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-[rgba(0,240,255,0.08)] to-[rgba(168,85,247,0.08)] border-b border-[var(--border)] text-xs text-[var(--text-secondary)]'''
new_return = '''    <div className="min-h-screen bg-[var(--bg)]">
      {/* Top Bar */}
      <div className="bg-[var(--bg-dark)] text-xs text-white/60'''

s = s.replace(old_return, new_return)

# Fix header
s = s.replace('bg-[rgba(15,15,35,0.85)]', 'bg-[#111827]')
s = s.replace('glass-strong border-b border-[var(--border)]', 'border-b border-white/5')
s = s.replace('from-[var(--cyan)] to-[var(--purple)]', 'bg-[var(--brand)]')
s = s.replace('text-[#050510]', 'text-white')
s = s.replace('text-glow-cyan font-display', 'text-white')
s = s.replace('text-[var(--cyan)]', 'text-[var(--brand)]')
s = s.replace('bg-[var(--bg-subtle)]', 'bg-[var(--bg-subtle)]')
s = s.replace('hover:text-[var(--cyan)]', 'hover:text-[var(--brand)]')
s = s.replace('hover:border-[rgba(0,240,255,0.3)]', 'hover:border-[var(--brand-200)]')
s = s.replace('hover:bg-[rgba(0,240,255,0.05)]', 'hover:bg-[var(--brand-50)]')

# Fix category nav
s = s.replace('bg-[rgba(10,10,26,0.8)]', 'bg-[#1E293B]')
s = s.replace('from-[var(--cyan)] to-[var(--purple)] px-3 py-1.5 text-xs font-semibold text-[#050510]', 'bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white')

# Fix mega menu
s = s.replace('glass-strong shadow-2xl', 'bg-white shadow-xl')
s = s.replace('bg-[rgba(15,15,35,0.6)]', 'bg-white')
s = s.replace('bg-[var(--bg-elevated)] shadow-sm', 'bg-white shadow-sm')

# Fix search bar
s = s.replace('focus:border-[var(--cyan)] focus:bg-[var(--bg-elevated)] focus:outline-none focus:ring-2 focus:ring-[rgba(0,240,255,0.1)]', 'focus:border-[var(--brand)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-100)]')
s = s.replace('from-[#0A0A20] to-[#0D0D25]', 'from-[var(--brand-50)] to-[var(--brand-100)]')
s = s.replace('text-[var(--cyan)]/40', 'text-[var(--brand)]/40')

# Fix footer
s = s.replace('bg-[var(--bg-subtle)]', 'bg-[var(--bg-darker)]')
s = s.replace('border-t border-[var(--border)]', 'border-t border-white/5')
s = s.replace('hover:text-[var(--cyan)]', 'hover:text-white/70')
s = s.replace('text-[var(--text-muted)]', 'text-white/40')
s = s.replace('text-[var(--text-primary)]', 'text-white')

# Fix mobile menu
s = s.replace('glass-strong shadow-2xl border-l border-[var(--border)]', 'bg-white shadow-2xl border-l border-[var(--border)]')

with open(shell_path, 'w', encoding='utf-8') as f:
    f.write(s)

print(f"Updated shell")

# === PRODUCTS PAGE ===
prod_path = "apps/modit/web/app/products/page.tsx"
with open(prod_path, 'r', encoding='utf-8') as f:
    p = f.read()

p = p.replace('bg-[var(--bg-card)]', 'bg-white')
p = p.replace('var(--brand)', 'var(--brand)')
p = p.replace('from-[#0A0A20] via-[#0D0D25] to-[#100820]', 'from-[var(--brand-50)] via-[var(--brand-100)] to-[var(--brand-50)]')
p = p.replace('from-[#0A0A20] to-[#0D0D25]', 'from-[var(--brand-50)] to-[var(--brand-100)]')
p = p.replace('focus:bg-[var(--bg-elevated)] focus:outline-none focus:ring-2 focus:ring-[rgba(0,240,255,0.15)]', 'focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-100)]')
p = p.replace('bg-[rgba(52,211,153,0.1)] px-3 py-1 text-xs font-medium text-[var(--green)]', 'bg-[var(--success-light)] px-3 py-1 text-xs font-medium text-[var(--success)]')
p = p.replace('bg-[rgba(220,38,38,0.9)]', 'bg-[#DC2626]')
p = p.replace('bg-[rgba(52,211,153,0.2)] px-2 py-0.5 text-[10px] font-bold text-[var(--green)]', 'bg-[var(--success-light)] px-2 py-0.5 text-[10px] font-bold text-[var(--success)]')
p = p.replace('bg-black/70', 'bg-black/50')
p = p.replace('focus:ring-[rgba(0,240,255,0.15)]', 'focus:ring-[var(--brand-100)]')
p = p.replace('hover:bg-[rgba(220,38,38,0.1)]', 'hover:bg-[var(--danger-light)]')
p = p.replace('bg-[var(--cyan)] text-[#050510]', 'bg-[var(--brand)] text-white')
p = p.replace('text-[var(--cyan)]/20', 'text-[var(--brand)]/20')
p = p.replace('text-[var(--cyan)]', 'text-[var(--brand)]')

with open(prod_path, 'w', encoding='utf-8') as f:
    f.write(p)

print(f"Updated products page")

# === CART PAGE ===
cart_path = "apps/modit/web/app/cart/page.tsx"
with open(cart_path, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('bg-[var(--bg-card)]', 'bg-white')
c = c.replace('var(--brand)', 'var(--brand)')
c = c.replace('from-[#0A0A20] to-[#0D0D25]', 'from-[var(--brand-50)] to-[var(--brand-100)]')
c = c.replace('bg-[rgba(52,211,153,0.1)]', 'bg-[var(--success-light)]')
c = c.replace('bg-[rgba(220,38,38,0.1)]', 'bg-[var(--danger-light)]')
c = c.replace('text-[var(--green)]', 'text-[var(--success)]')
c = c.replace('bg-[var(--cyan)] text-[#050510]', 'bg-[var(--brand)] text-white')
c = c.replace('text-[var(--cyan)]', 'text-[var(--brand)]')

with open(cart_path, 'w', encoding='utf-8') as f:
    f.write(c)

print(f"Updated cart page")

# === PRODUCT DETAIL PAGE ===
detail_path = "apps/modit/web/app/products/[id]/page.tsx"
with open(detail_path, 'r', encoding='utf-8') as f:
    d = f.read()

d = d.replace('bg-[var(--bg-card)]', 'bg-white')
d = d.replace('var(--brand)', 'var(--brand)')
d = d.replace('from-[#0A0A20] to-[#0D0D25]', 'from-[var(--brand-50)] to-[var(--brand-100)]')
d = d.replace('bg-[rgba(52,211,153,0.1)]', 'bg-[var(--success-light)]')
d = d.replace('bg-[rgba(220,38,38,0.1)]', 'bg-[var(--danger-light)]')
d = d.replace('text-[var(--green)]', 'text-[var(--success)]')
d = d.replace('bg-[var(--cyan)] text-[#050510]', 'bg-[var(--brand)] text-white')
d = d.replace('text-[var(--cyan)]', 'text-[var(--brand)]')
d = d.replace('focus:border-[var(--cyan)]', 'focus:border-[var(--brand)]')
d = d.replace('focus:ring-[rgba(0,240,255,0.15)]', 'focus:ring-[var(--brand-100)]')

with open(detail_path, 'w', encoding='utf-8') as f:
    f.write(d)

print(f"Updated product detail page")

# === ALL REMAINING PAGES ===
pages_dir = "apps/modit/web/app"
for root, dirs, files_list in os.walk(pages_dir):
    for fname in files_list:
        if fname.endswith('.tsx') and fname not in ['page.tsx']:
            fpath = os.path.join(root, fname)
            try:
                with open(fpath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Generic dark-to-light replacements
                content = content.replace('bg-[var(--bg-card)]', 'bg-white')
                content = content.replace('var(--cyan)', 'var(--brand)')
                content = content.replace('var(--purple)', 'var(--brand)')
                content = content.replace('text-[var(--cyan)]', 'text-[var(--brand)]')
                content = content.replace('text-[#050510]', 'text-white')
                content = content.replace('from-[#0A0A20]', 'from-[var(--brand-50)]')
                content = content.replace('to-[#0D0D25]', 'to-[var(--brand-100)]')
                content = content.replace('bg-[rgba(52,211,153,0.1)]', 'bg-[var(--success-light)]')
                content = content.replace('bg-[rgba(220,38,38,0.1)]', 'bg-[var(--danger-light)]')
                content = content.replace('text-[var(--green)]', 'text-[var(--success)]')
                content = content.replace('text-[var(--cyan)]/20', 'text-[var(--brand)]/20')
                
                with open(fpath, 'w', encoding='utf-8') as f:
                    f.write(content)
            except:
                pass

print("Updated all remaining pages")
print("Done!")
