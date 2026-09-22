export interface PricelistRow {
  sku: string;
  name: string;
  brand: string | null;
  category: string;
  unit: string;
  price: number;
  mrp: number | null;
  discount: number;
  bulkPrice: number | null;
  bulkMinQty: number | null;
  inStock: boolean;
}

export function renderPricelistHtml(title: string, subtitle: string, rows: PricelistRow[], generatedAt: string): string {
  const body = rows
    .map(
      (r, idx) => `<tr>
        <td style="padding:8px;border:1px solid #DDD6EE;font-size:12px;text-align:center;">${idx + 1}</td>
        <td style="padding:8px;border:1px solid #DDD6EE;font-size:12px;">${r.name}<br/><span style="color:#9B8CB5;font-size:11px;">SKU: ${r.sku}</span></td>
        <td style="padding:8px;border:1px solid #DDD6EE;font-size:12px;">${r.brand ?? "—"}</td>
        <td style="padding:8px;border:1px solid #DDD6EE;font-size:12px;">${r.category}</td>
        <td style="padding:8px;border:1px solid #DDD6EE;font-size:12px;text-align:center;">${r.unit}</td>
        <td style="padding:8px;border:1px solid #DDD6EE;font-size:12px;text-align:right;">${r.price.toLocaleString("en-IN")}</td>
        <td style="padding:8px;border:1px solid #DDD6EE;font-size:12px;text-align:right;">${r.mrp != null ? r.mrp.toLocaleString("en-IN") : "—"}</td>
        <td style="padding:8px;border:1px solid #DDD6EE;font-size:12px;text-align:center;">${r.bulkPrice != null && r.bulkMinQty != null ? `₹${r.bulkPrice.toLocaleString("en-IN")} @ ${r.bulkMinQty}+` : "—"}</td>
        <td style="padding:8px;border:1px solid #DDD6EE;font-size:12px;text-align:center;color:${r.inStock ? "#6aa514" : "#d33"};font-weight:bold;">${r.inStock ? "In Stock" : "Sold Out"}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title></head><body style="font-family:Arial,sans-serif;color:#150726;margin:40px;">
<h1 style="color:#2D1B69;font-size:22px;margin-bottom:4px;">${title}</h1>
<p style="color:#9B8CB5;font-size:12px;margin:0 0 4px;">${subtitle}</p>
<p style="color:#9B8CB5;font-size:11px;margin:0 0 20px;">Generated on ${generatedAt} • Prices in INR • GST extra as applicable • Contact support@modit.in for volume pricing</p>
<table style="border-collapse:collapse;width:100%;">
<thead><tr style="background:#2D1B69;color:white;">
<th style="padding:8px;border:1px solid #1E0F4A;font-size:11px;">#</th>
<th style="padding:8px;border:1px solid #1E0F4A;font-size:11px;">Product</th>
<th style="padding:8px;border:1px solid #1E0F4A;font-size:11px;">Brand</th>
<th style="padding:8px;border:1px solid #1E0F4A;font-size:11px;">Category</th>
<th style="padding:8px;border:1px solid #1E0F4A;font-size:11px;">Unit</th>
<th style="padding:8px;border:1px solid #1E0F4A;font-size:11px;text-align:right;">Price</th>
<th style="padding:8px;border:1px solid #1E0F4A;font-size:11px;text-align:right;">MRP</th>
<th style="padding:8px;border:1px solid #1E0F4A;font-size:11px;">Bulk Rate</th>
<th style="padding:8px;border:1px solid #1E0F4A;font-size:11px;">Status</th>
</tr></thead>
<tbody>${body}</tbody>
</table>
<p style="margin-top:24px;font-size:11px;color:#9B8CB5;">All prices are subject to availability. Free delivery on orders above ₹5,000.</p>
</body></html>`;
}

export function downloadPricelistHtml(title: string, subtitle: string, rows: PricelistRow[]) {
  const html = renderPricelistHtml(title, subtitle, rows, new Date().toLocaleDateString("en-IN"));
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-pricelist.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadPricelistCsv(title: string, rows: PricelistRow[]) {
  const header = ["SKU", "Product", "Brand", "Category", "Unit", "Price", "MRP", "Bulk Rate", "Bulk Min Qty", "Status"];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.sku,
        `"${r.name.replace(/"/g, '""')}"`,
        `"${r.brand ?? ""}"`,
        `"${r.category.replace(/"/g, '""')}"`,
        r.unit,
        r.price,
        r.mrp ?? "",
        r.bulkPrice ?? "",
        r.bulkMinQty ?? "",
        r.inStock ? "In Stock" : "Sold Out",
      ].join(",")
    ),
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-pricelist.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function printPricelist(title: string, subtitle: string, rows: PricelistRow[]) {
  const html = renderPricelistHtml(title, subtitle, rows, new Date().toLocaleDateString("en-IN"));
  const win = window.open("", "_blank", "width=900,height=900");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

export function buildPricelistRows(products: Array<{
  sku?: string;
  name: string;
  brand?: string | null;
  category?: string;
  unit?: string;
  price: number;
  mrp?: number | null;
  discount?: number;
  bulkPrice?: number | null;
  bulkMinQty?: number | null;
  inStock?: boolean;
}>): PricelistRow[] {
  return products.map((p) => ({
    sku: p.sku || p.name.slice(0, 12).toUpperCase().replace(/\s+/g, "-"),
    name: p.name,
    brand: p.brand ?? null,
    category: p.category || "",
    unit: p.unit || "unit",
    price: p.price,
    mrp: p.mrp ?? null,
    discount: p.discount ?? 0,
    bulkPrice: p.bulkPrice ?? null,
    bulkMinQty: p.bulkMinQty ?? null,
    inStock: p.inStock !== false,
  }));
}

export function getCategoryName(slug: string, categoryMap: Record<string, string>): string {
  return categoryMap[slug] || slug.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
}