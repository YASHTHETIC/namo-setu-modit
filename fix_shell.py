import re

shell_path = "apps/modit/web/components/modit-shell.tsx"
with open(shell_path, 'r', encoding='utf-8') as f:
    s = f.read()

# Fix MODIT logo text
s = s.replace('text-lg font-extrabold tracking-tight text-white">MODIT', 'text-lg font-extrabold tracking-tight text-[#0F172A]">MODIT')

# Fix "Deliver to" section - should be dark text on white bg
s = s.replace('text-white/40">Deliver to', 'text-gray-400">Deliver to')
s = s.replace('font-semibold text-white">New Delhi', 'font-semibold text-gray-900">New Delhi')

# Fix search input
s = s.replace('bg-[#020617] pl-10 pr-4 text-sm transition-colors placeholder:text-white/40 focus:border-[var(--brand)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 text-white"',
    'bg-gray-50 pl-10 pr-4 text-sm transition-colors placeholder:text-gray-400 focus:border-[var(--brand)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 text-gray-900"')

# Fix search icon color
s = s.replace('text-white/40" />', 'text-gray-400" />')

# Fix search dropdown
s = s.replace('hover:bg-[#020617] transition-colors"', 'hover:bg-orange-50 transition-colors"')
s = s.replace('hover:bg-[#020617] transition-colors">', 'hover:bg-orange-50 transition-colors">')

# Fix search dropdown product text
s = s.replace('font-medium text-white truncate', 'font-medium text-gray-900 truncate')
s = s.replace('text-white/40">{p.category}', 'text-gray-400">{p.category}')

# Fix search dropdown link items
s = s.replace('hover:bg-[#020617]', 'hover:bg-orange-50')

# Fix cart hover
s = s.replace('hover:bg-[#020617] transition-colors"', 'hover:bg-orange-50 transition-colors"')

# Fix Sign In button and user menu
s = s.replace('hover:bg-[#020617]"', 'hover:bg-orange-50"')

# Fix user menu text
s = s.replace('text-sm font-medium text-white hover:bg-orange-50">', 'text-sm font-medium text-gray-900 hover:bg-orange-50">')
s = s.replace('text-sm text-[var(--text-secondary)] hover:bg-orange-50">', 'text-sm text-gray-600 hover:bg-orange-50">')

# Fix mega menu category text
s = s.replace('text-sm font-semibold text-white hover:text-[var(--brand)]', 'text-sm font-semibold text-gray-900 hover:text-[var(--brand)]')
s = s.replace('text-xs text-white/40 hover:text-[var(--brand)]', 'text-xs text-gray-500 hover:text-[var(--brand)]')

# Fix glass classes on light bg elements
s = s.replace('transition-colors lg:flex glass"', 'transition-colors lg:flex"')

# Fix category nav links - should be gray on light bg
s = s.replace('text-white/60 hover:text-white hover:bg-white/5', 'text-gray-500 hover:text-[var(--brand)] hover:bg-white')

# Fix mobile sidebar
s = s.replace('glass-strong shadow-2xl border-l border-[var(--border)]', 'bg-white shadow-2xl border-l border-gray-200')
s = s.replace('border-[var(--border-subtle)]', 'border-gray-100')

# Fix glass-strong references
s = s.replace('glass-strong', 'bg-white/95 backdrop-blur')
s = s.replace('glass-strong shadow-xl', 'bg-white shadow-xl border border-gray-200')

# Fix remaining text-white in non-footer, non-topbar areas
# The top bar (bg-[#020617]) keeps white text, the footer keeps white text
# But the header (white bg) should not have white text

# Fix any remaining dark bg references in the header area
s = s.replace('bg-[#020617]', 'bg-gray-50')

# Fix remaining white text in dropdown menus
s = s.replace('text-white hover:bg-orange-50', 'text-gray-700 hover:bg-orange-50')

# Fix border-glow references
s = s.replace('border-glow', '')

# Fix remaining bg dark references
s = s.replace('from-[var(--cyan)]', 'from-[var(--brand)]')

# Fix location dropdown text
s = s.replace('font-medium text-white hover:bg-orange-50">', 'font-medium text-gray-900 hover:bg-orange-50">')

# Fix mega menu subcategory text
s = s.replace('text-white/60 hover:text-[var(--brand)]', 'text-gray-500 hover:text-[var(--brand)]')
s = s.replace('text-xs text-white/50 hover:text-[var(--brand)]', 'text-xs text-gray-500 hover:text-[var(--brand)]')

# Fix the top bar to use proper dark navy
s = s.replace('bg-[var(--bg-dark)] text-xs text-gray-500', 'bg-[#0F172A] text-xs text-white/70')
s = s.replace('text-white/10', 'text-white/20')

# Fix remaining "text-white" in non-footer/header areas
# Find lines with text-white that are in header context and fix them
lines = s.split('\n')
in_header = False
in_footer = False
in_topbar = False
for i, line in enumerate(lines):
    if '<header' in line:
        in_header = True
    if '</header>' in line:
        in_header = False
    if '<footer' in line:
        in_footer = True
    if '</footer>' in line:
        in_footer = False
    
    if in_header and not in_footer:
        if 'text-white' in line and 'bg-[#0F172A]' not in line and 'bg-white' not in line and 'text-white/70' not in line and 'text-white/20' not in line:
            # Don't touch brand text or badge
            if 'text-white"' in line and 'font-bold' not in line and 'font-extrabold' not in line:
                lines[i] = line.replace('text-white"', 'text-gray-900"')
            elif 'text-white">' in line:
                lines[i] = line.replace('text-white">', 'text-gray-900">')

s = '\n'.join(lines)

with open(shell_path, 'w', encoding='utf-8') as f:
    f.write(s)

print("Shell comprehensively fixed")
