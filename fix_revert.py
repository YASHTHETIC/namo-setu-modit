import re

# Fix shell
shell_path = "apps/modit/web/components/modit-shell.tsx"
with open(shell_path, 'r', encoding='utf-8') as f:
    s = f.read()

# Replace dark backgrounds with white/light
s = s.replace('bg-[var(--bg-base)]', 'bg-[#F8FAFC]')
s = s.replace('bg-[var(--bg-darker)]', 'bg-[#020617]')

# Fix header - white background
s = s.replace('bg-[#111827]', 'bg-white')
s = s.replace('border-b border-white/5', 'border-b border-gray-100')
s = s.replace('bg-gradient-to-r from-[rgba(0,240,255,0.08)] to-[rgba(168,85,247,0.08)] border-b border-[var(--border)] text-xs text-white/60',
    'bg-[#0F172A] text-xs text-white/70')

# Fix logo
s = s.replace('bg-gradient-to-br from-[var(--cyan)] to-[var(--purple)]', 'bg-[#0F172A]')
s = s.replace('text-glow-cyan font-display', 'font-display')

# Fix brand colors
s = s.replace('var(--cyan)', 'var(--brand)')
s = s.replace('text-[var(--brand)]', 'text-[var(--brand)]')

# Fix category nav
s = s.replace('bg-[#1E293B]', 'bg-gray-50/50')
s = s.replace('text-white/60', 'text-gray-500')
s = s.replace('hover:text-white', 'hover:text-[var(--brand)]')
s = s.replace('hover:bg-white/5', 'hover:bg-white')
s = s.replace('border-white/5', 'border-gray-100')

# Fix search bar
s = s.replace('bg-[var(--bg-subtle)]', 'bg-gray-50')
s = s.replace('border-[var(--border)]', 'border-gray-200')
s = s.replace('border-[var(--border-input)]', 'border-gray-200')
s = s.replace('focus:border-[var(--brand)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(0,240,255,0.1)]',
    'focus:border-[var(--brand)] focus:bg-white focus:ring-4 focus:ring-orange-100 outline-none')
s = s.replace('focus:border-[var(--cyan)]', 'focus:border-[var(--brand)]')
s = s.replace('focus:ring-[var(--brand-100)]', 'focus:ring-orange-100')

# Fix mega menu
s = s.replace('bg-white shadow-xl', 'bg-white shadow-xl')
s = s.replace('divide-[var(--border)]', 'divide-gray-100')

# Fix category nav buttons  
s = s.replace('bg-gradient-to-r from-[var(--cyan)] to-[var(--purple)] px-3 py-1.5 text-xs font-semibold text-[#050510]',
    'bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white')
s = s.replace('bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white', 
    'bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white')

# Fix mobile menu
s = s.replace('glass-strong shadow-2xl border-l border-[var(--border)]', 'bg-white shadow-2xl border-l border-gray-200')

# Fix footer  
s = s.replace('bg-[var(--bg-darker)]', 'bg-[#020617]')
s = s.replace('border-t border-white/5', 'border-t border-white/5')
s = s.replace('hover:text-white/70', 'hover:text-white/70')
s = s.replace('text-white/40', 'text-white/40')
s = s.replace('text-white', 'text-white')

with open(shell_path, 'w', encoding='utf-8') as f:
    f.write(s)

print("Shell updated")

# Fix products page
prod_path = "apps/modit/web/app/products/page.tsx"
with open(prod_path, 'r', encoding='utf-8') as f:
    p = f.read()

p = p.replace('bg-[var(--bg-card)]', 'bg-white')
p = p.replace('from-[var(--brand-50)] via-[var(--brand-100)] to-[var(--brand-50)]', 'from-orange-50 via-amber-50 to-orange-100')
p = p.replace('from-[var(--brand-50)] to-[var(--brand-100)]', 'from-orange-50 to-amber-50')
p = p.replace('bg-[var(--success-light)]', 'bg-emerald-50')
p = p.replace('bg-[var(--danger-light)]', 'bg-red-50')
p = p.replace('text-[var(--success)]', 'text-emerald-600')
p = p.replace('bg-[#DC2626]', 'bg-red-500')
p = p.replace('bg-[var(--brand)] text-white', 'bg-[var(--brand)] text-white')
p = p.replace('hover:bg-[var(--danger-light)]', 'hover:bg-red-50')
p = p.replace('focus:ring-[var(--brand-100)]', 'focus:ring-orange-100')

with open(prod_path, 'w', encoding='utf-8') as f:
    f.write(p)

print("Products page updated")

# Fix cart page
cart_path = "apps/modit/web/app/cart/page.tsx"
with open(cart_path, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('bg-[var(--bg-card)]', 'bg-white')
c = c.replace('bg-[var(--success-light)]', 'bg-emerald-50')
c = c.replace('bg-[var(--danger-light)]', 'bg-red-50')
c = c.replace('text-[var(--success)]', 'text-emerald-600')
c = c.replace('bg-[var(--brand)] text-white', 'bg-[var(--brand)] text-white')
c = c.replace('text-[var(--brand)]', 'text-[var(--brand)]')

with open(cart_path, 'w', encoding='utf-8') as f:
    f.write(c)

print("Cart page updated")

# Fix product detail
detail_path = "apps/modit/web/app/products/[id]/page.tsx"
with open(detail_path, 'r', encoding='utf-8') as f:
    d = f.read()

d = d.replace('bg-[var(--bg-card)]', 'bg-white')
d = d.replace('from-[var(--brand-50)] to-[var(--brand-100)]', 'from-orange-50 to-amber-50')
d = d.replace('bg-[var(--success-light)]', 'bg-emerald-50')
d = d.replace('bg-[var(--danger-light)]', 'bg-red-50')
d = d.replace('text-[var(--success)]', 'text-emerald-600')
d = d.replace('bg-[var(--brand)] text-white', 'bg-[var(--brand)] text-white')
d = d.replace('text-[var(--brand)]', 'text-[var(--brand)]')
d = d.replace('focus:border-[var(--brand)]', 'focus:border-[var(--brand)]')
d = d.replace('focus:ring-[var(--brand-100)]', 'focus:ring-orange-100')

with open(detail_path, 'w', encoding='utf-8') as f:
    f.write(d)

print("Detail page updated")

# Fix all remaining pages
import os
pages_dir = "apps/modit/web/app"
for root, dirs, files_list in os.walk(pages_dir):
    for fname in files_list:
        if fname.endswith('.tsx') and fname not in ['page.tsx']:
            fpath = os.path.join(root, fname)
            try:
                with open(fpath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                content = content.replace('bg-[var(--bg-card)]', 'bg-white')
                content = content.replace('var(--cyan)', 'var(--brand)')
                content = content.replace('text-[var(--cyan)]', 'text-[var(--brand)]')
                content = content.replace('text-[#050510]', 'text-white')
                content = content.replace('from-[var(--brand-50)]', 'from-orange-50')
                content = content.replace('to-[var(--brand-100)]', 'to-amber-100')
                content = content.replace('bg-[var(--success-light)]', 'bg-emerald-50')
                content = content.replace('bg-[var(--danger-light)]', 'bg-red-50')
                content = content.replace('text-[var(--success)]', 'text-emerald-600')
                content = content.replace('text-[#050510]', 'text-white')
                
                with open(fpath, 'w', encoding='utf-8') as f:
                    f.write(content)
            except:
                pass

print("All remaining pages updated")
print("Done!")
