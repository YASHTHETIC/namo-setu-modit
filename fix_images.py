import re

# Read the file
with open("apps/modit/web/lib/product-data.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Fix electrical wire images - replace faucet image with actual wire images
# The faucet image is photo-1585704032915-c3400ca199e7
content = content.replace(
    'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1764866085369-44c7ef1a18f3?w=400&h=400&fit=crop'
)

# Also check for any other wrong images
# Electrical wires should use wire images, not faucet
content = content.replace(
    'https://images.unsplash.com/photo-1634126534022-108a831684d7?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1761507320645-b11a00bfcc34?w=400&h=400&fit=crop'
)

with open("apps/modit/web/lib/product-data.ts", "w", encoding="utf-8") as f:
    f.write(content)

print("Electrical wire images fixed")
