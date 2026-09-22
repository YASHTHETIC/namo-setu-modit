export interface InvoiceItem {
  name: string;
  sku: string;
  quantity: number;
  unit: string;
  price: number;
  gstRate: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  orderId: string;
  date: string;
  gstin: string;
  buyerName: string;
  buyerAddress: string;
  buyerPincode: string;
  items: InvoiceItem[];
  subtotal: number;
  gst: number;
  shipping: number;
  total: number;
}

function gstBreakdown(items: InvoiceItem[]) {
  const map = new Map<number, { taxable: number; gst: number }>();
  items.forEach((i) => {
    const base = i.price * i.quantity;
    const gst = base * (i.gstRate / 100);
    const prev = map.get(i.gstRate) ?? { taxable: 0, gst: 0 };
    map.set(i.gstRate, { taxable: prev.taxable + base, gst: prev.gst + gst });
  });
  return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
}

export function renderInvoiceHtml(data: InvoiceData): string {
  const rows = gstBreakdown(data.items);
  const itemsRows = data.items
    .map(
      (i, idx) => `<tr>
        <td style="padding:8px;border:1px solid #DDD6EE;font-size:12px;">${idx + 1}</td>
        <td style="padding:8px;border:1px solid #DDD6EE;font-size:12px;">${i.name}<br/><span style="color:#9B8CB5">SKU: ${i.sku}</span></td>
        <td style="padding:8px;border:1px solid #DDD6EE;font-size:12px;text-align:center;">${i.quantity} ${i.unit}</td>
        <td style="padding:8px;border:1px solid #DDD6EE;font-size:12px;text-align:right;">${i.price.toLocaleString("en-IN")}</td>
        <td style="padding:8px;border:1px solid #DDD6EE;font-size:12px;text-align:right;">${(i.price * i.quantity).toLocaleString("en-IN")}</td>
        <td style="padding:8px;border:1px solid #DDD6EE;font-size:12px;text-align:center;">${i.gstRate}%</td>
        <td style="padding:8px;border:1px solid #DDD6EE;font-size:12px;text-align:right;">${(i.price * i.quantity * (i.gstRate / 100)).toLocaleString("en-IN")}</td>
      </tr>`
    )
    .join("");

  const gstRows = rows
    .map(
      ([rate, v]) => `<tr>
        <td style="padding:8px;border:1px solid #DDD6EE;font-size:12px;text-align:center;">${rate}%</td>
        <td style="padding:8px;border:1px solid #DDD6EE;font-size:12px;text-align:right;">${v.taxable.toLocaleString("en-IN")}</td>
        <td style="padding:8px;border:1px solid #DDD6EE;font-size:12px;text-align:right;">${v.gst.toLocaleString("en-IN")}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Invoice ${data.invoiceNumber}</title></head><body style="font-family:Arial,sans-serif;color:#150726;margin:40px;">
<h1 style="color:#2D1B69;font-size:22px;margin-bottom:4px;">MODIT INVOICE</h1>
<p style="color:#9B8CB5;font-size:12px;margin:0 0 8px;">B2B Building Material Marketplace</p>
<p style="font-size:12px;margin:0 0 4px;"><strong>Invoice No:</strong> ${data.invoiceNumber}</p>
<p style="font-size:12px;margin:0 0 4px;"><strong>Order ID:</strong> ${data.orderId}</p>
<p style="font-size:12px;margin:0 0 4px;"><strong>Date:</strong> ${data.date}</p>
<p style="font-size:12px;margin:0 0 4px;"><strong>Buyer GSTIN:</strong> ${data.gstin || "Unregistered (B2C)"}</p>
<p style="font-size:12px;margin:0 0 4px;"><strong>Bill To:</strong> ${data.buyerName}</p>
<p style="font-size:12px;margin:0 0 20px;">${data.buyerAddress} — ${data.buyerPincode}</p>

<table style="border-collapse:collapse;width:100%;">
<thead><tr style="background:#F0ECF9;">
<th style="padding:8px;border:1px solid #DDD6EE;font-size:11px;text-align:left;">#</th>
<th style="padding:8px;border:1px solid #DDD6EE;font-size:11px;text-align:left;">Item</th>
<th style="padding:8px;border:1px solid #DDD6EE;font-size:11px;">Qty</th>
<th style="padding:8px;border:1px solid #DDD6EE;font-size:11px;">Rate</th>
<th style="padding:8px;border:1px solid #DDD6EE;font-size:11px;">Amount</th>
<th style="padding:8px;border:1px solid #DDD6EE;font-size:11px;">GST%</th>
<th style="padding:8px;border:1px solid #DDD6EE;font-size:11px;">GST Amt</th>
</tr></thead>
<tbody>${itemsRows}</tbody>
</table>

<table style="border-collapse:collapse;width:100%;margin-top:16px;">
<thead><tr style="background:#7CB518;color:white;">
<th style="padding:8px;border:1px solid #5f8f12;font-size:11px;">GST Rate</th>
<th style="padding:8px;border:1px solid #5f8f12;font-size:11px;">Taxable Value</th>
<th style="padding:8px;border:1px solid #5f8f12;font-size:11px;">GST Amount</th>
</tr></thead>
<tbody>${gstRows}</tbody>
</table>

<table style="width:100%;margin-top:20px;border-collapse:collapse;">
<tr><td style="padding:6px;font-size:13px;">Subtotal</td><td style="padding:6px;font-size:13px;text-align:right;">${data.subtotal.toLocaleString("en-IN")}</td></tr>
<tr><td style="padding:6px;font-size:13px;">GST</td><td style="padding:6px;font-size:13px;text-align:right;">${data.gst.toLocaleString("en-IN")}</td></tr>
<tr><td style="padding:6px;font-size:13px;">Shipping</td><td style="padding:6px;font-size:13px;text-align:right;">${data.shipping > 0 ? data.shipping.toLocaleString("en-IN") : "FREE"}</td></tr>
<tr><td style="padding:8px;font-size:16px;font-weight:bold;border-top:2px solid #2D1B69;">Grand Total</td><td style="padding:8px;font-size:16px;font-weight:bold;text-align:right;border-top:2px solid #2D1B69;">${data.total.toLocaleString("en-IN")}</td></tr>
</table>
<p style="margin-top:28px;font-size:11px;color:#9B8CB5;">This is a computer generated GST invoice. No physical signature required. For queries contact support@modit.in</p>
</body></html>`;
}

export function downloadInvoiceHtml(data: InvoiceData) {
  const html = renderInvoiceHtml(data);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.invoiceNumber}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function printInvoiceHtml(data: InvoiceData) {
  const html = renderInvoiceHtml(data);
  const win = window.open("", "_blank", "width=800,height=900");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}