export function exportToCSV(data, filename) {
  if (!data || !data.length) {
    alert("No data available to export");
    return;
  }

  // Get headers from first object keys
  const headers = Object.keys(data[0]);
  
  // Convert array of objects to CSV string
  const csvContent = [
    headers.join(","), // Header row
    ...data.map(row => 
      headers.map(header => {
        const val = row[header];
        // Wrap strings in quotes if they contain commas
        if (typeof val === 'string' && val.includes(',')) {
          return `"${val}"`;
        }
        return val !== null && val !== undefined ? val : "";
      }).join(",")
    )
  ].join("\n");

  // Create a blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printReport() {
  window.print();
}

export function printKOT(ordersInput, selectedItemIds = null) {
  try {
    if (!ordersInput) return;
    const orders = Array.isArray(ordersInput) ? ordersInput : [ordersInput];

    const ordersToPrint = orders.map(order => {
      const itemsToPrint = (order.items || []).filter(item => 
        selectedItemIds && selectedItemIds.length > 0 ? selectedItemIds.includes(item.id) : true
      );
      return { ...order, itemsToPrint };
    }).filter(o => o.itemsToPrint.length > 0);

    if (ordersToPrint.length === 0) return;

    const printWindow = window.open('', '_blank', 'width=380,height=700');
    if (!printWindow) {
      console.error("Popup blocker prevented KOT print");
      return;
    }

    const ticketsHtml = ordersToPrint.map((order, index) => {
      const mainItems = order.itemsToPrint;
      const regularItems = mainItems.filter(it => it.is_deal !== 1);
      const dealItems = mainItems.filter(it => it.is_deal === 1);

      // Group regular items by station
      const stationGroups = {};
      regularItems.forEach(item => {
        const station = (item.station || 'General').toUpperCase();
        if (!stationGroups[station]) stationGroups[station] = [];
        stationGroups[station].push(item);
      });

      // Build station sections HTML
      const stationHtml = Object.entries(stationGroups).length > 0 ? `
        <div class="section-label">REGULAR ITEMS</div>
        ${Object.entries(stationGroups).map(([station, items]) => `
          <div class="station-group">
            <div class="station-header">▸ ${station}</div>
            ${items.map(item => `
              <div class="item">
                <span class="item-qty">${item.qty}x</span>
                <span class="item-name">${item.name}</span>
              </div>
              ${item.notes ? `<div class="item-notes">📝 ${item.notes}</div>` : ''}
              ${item.modifiers ? `<div class="item-notes">${item.modifiers}</div>` : ''}
            `).join('')}
          </div>
        `).join('')}
      ` : '';

      // Build deals section HTML — each deal in a solid bordered box
      const dealsHtml = dealItems.length > 0 ? `
        <div class="section-label">DEALS / COMBOS</div>
        ${dealItems.map(deal => {
          const subs = deal.sub_items || [];
          return `
            <div class="deal-box">
              <div class="deal-title">★ ${deal.name}  ×${deal.qty}</div>
              <div class="deal-contents">
                ${subs.map(sub => {
                  const st = (sub.station || deal.station || '').toUpperCase();
                  return `
                    <div class="deal-line">
                      <span class="deal-line-name">${sub.qty || 1}x ${sub.name}</span>
                      ${st ? `<span class="station-tag">${st}</span>` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
              ${deal.notes ? `<div class="item-notes" style="margin-top:4px;">📝 ${deal.notes}</div>` : ''}
            </div>
          `;
        }).join('')}
      ` : '';

      return `
        <div class="ticket" style="${index > 0 ? 'page-break-before: always; margin-top: 20px;' : ''}">
          <h2>KITCHEN TICKET</h2>
          <div class="meta">
            <div><strong>Order:</strong> #${order.id}</div>
            <div><strong>Type:</strong> ${String(order.type).toLowerCase() === "dine-in" ? "Dine-In (Table " + (order.table_id || order.table || "") + ")" : (order.type || "TAKEAWAY").toUpperCase()}</div>
            <div><strong>Time:</strong> ${(() => {
              if (!order.time) return new Date().toLocaleTimeString();
              const parsed = new Date(order.time);
              return isNaN(parsed.getTime()) ? order.time : parsed.toLocaleTimeString();
            })()}</div>
            <div><strong>Waiter:</strong> ${order.waiter || 'None'}</div>
          </div>
          <div class="divider-thick"></div>
          ${stationHtml}
          ${dealsHtml}
          <div class="divider-thick"></div>
          <div class="summary">
            <strong>Total Items:</strong> ${mainItems.reduce((s, it) => s + (it.qty || 1), 0)}
          </div>
          <div class="divider"></div>
          <div style="text-align: center; font-size: 11px; font-weight: bold;">— End of Ticket —</div>
        </div>
      `;
    }).join('');

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>KOT Print</title>
          <style>
            @page { margin: 0; size: 80mm auto; }
            body { 
              font-family: monospace; 
              width: 80mm; 
              margin: 0; 
              padding: 4mm;
              font-size: 13px;
            }
            h2 { 
              text-align: center; margin: 0 0 8px 0; font-size: 18px; 
              border-bottom: 2px solid #000; padding-bottom: 6px; 
              letter-spacing: 2px;
            }
            .meta { margin-bottom: 8px; font-size: 12px; line-height: 1.6; }

            /* Section labels */
            .section-label {
              font-size: 11px; font-weight: bold; text-align: center;
              letter-spacing: 2px; padding: 3px 0;
              background: #000; color: #fff;
              margin-bottom: 8px;
            }

            /* Station groups */
            .station-group { margin-bottom: 8px; }
            .station-header { 
              font-size: 13px; font-weight: bold; 
              text-transform: uppercase; letter-spacing: 1px;
              border-bottom: 1px solid #000; 
              padding-bottom: 3px; margin-bottom: 5px;
            }
            .item { display: flex; align-items: baseline; gap: 6px; margin-bottom: 3px; }
            .item-qty { font-weight: bold; font-size: 15px; min-width: 24px; }
            .item-name { font-weight: bold; font-size: 14px; }
            .item-notes { font-size: 11px; font-style: italic; margin-left: 30px; margin-bottom: 4px; color: #333; }

            /* Deal box — thick border */
            .deal-box {
              border: 2px solid #000;
              padding: 6px 8px;
              margin-bottom: 8px;
            }
            .deal-title {
              font-size: 15px; font-weight: bold;
              text-align: center;
              border-bottom: 1px dashed #000;
              padding-bottom: 5px; margin-bottom: 6px;
            }
            .deal-contents { }
            .deal-line {
              display: flex; justify-content: space-between; align-items: center;
              margin-bottom: 3px; font-size: 13px;
            }
            .deal-line-name { font-weight: bold; }
            .station-tag {
              font-size: 9px; font-weight: bold;
              border: 1px solid #000; padding: 1px 4px;
              text-transform: uppercase; letter-spacing: 0.5px;
            }

            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .divider-thick { border-top: 2px solid #000; margin: 10px 0; }
            .summary { text-align: center; font-size: 12px; margin: 6px 0; }
          </style>
        </head>
        <body>
          ${ticketsHtml}
        </body>
      </html>
    `);
    printWindow.document.close();

    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      setTimeout(() => {
        printWindow.close();
      }, 500);
    }, 250);
  } catch (err) {
    console.error("Failed to print KOT:", err);
  }
}

export async function printQRLabels(order, items, profile) {
  try {
    if (!order || !items || items.length === 0) return;
    const qrPrinter = profile?.qrPrinter || "";

    const labelsHtml = items.map(item => {
      // Basic Google Chart API for QR code (works offline if cached, or we can use an SVG generator but we don't have one here)
      // Since it's offline ERP, we will use a plain text barcode layout or simple text if we can't bundle a library.
      // Actually, we can use the `https://api.qrserver.com...` just in case, but let's make it look like a nice sticker.
      return `
        <div class="label">
          <div class="header">${profile?.name || 'Restaurant'}</div>
          <div class="title">${item.name}</div>
          <div class="meta">
            Order: #${order.id} | Qty: ${item.qty}
          </div>
          ${item.notes ? `<div class="notes">Notes: ${item.notes}</div>` : ''}
          <div class="qr-placeholder">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`Order:${order.id}|Item:${item.name}`)}" alt="QR" />
          </div>
          <div class="footer">${new Date().toLocaleString()}</div>
        </div>
      `;
    }).join("");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            @page { size: 50mm 50mm; margin: 0; }
            body { font-family: monospace; margin: 0; padding: 0; width: 50mm; height: 50mm; background: white; color: black; }
            .label { width: 50mm; height: 50mm; box-sizing: border-box; padding: 2mm; text-align: center; display: flex; flex-direction: column; justify-content: space-between; align-items: center; page-break-after: always; overflow: hidden; }
            .header { font-size: 10px; font-weight: bold; border-bottom: 1px solid black; width: 100%; padding-bottom: 1mm; margin-bottom: 1mm; }
            .title { font-size: 12px; font-weight: bold; line-height: 1.2; word-wrap: break-word; max-width: 100%; }
            .meta { font-size: 9px; margin-top: 1mm; }
            .notes { font-size: 8px; font-style: italic; margin-top: 1mm; }
            .qr-placeholder img { width: 25mm; height: 25mm; margin: 1mm auto; display: block; }
            .footer { font-size: 7px; width: 100%; border-top: 1px solid black; padding-top: 1mm; margin-top: 1mm; }
          </style>
        </head>
        <body>
          ${labelsHtml}
        </body>
      </html>
    `;
    
    // We import api inside the function to avoid circular deps if any
    const api = (await import('./../api/client')).default;
    await api.printHtml(html, qrPrinter);
  } catch (err) {
    console.error("Failed to print QR Labels:", err);
  }
}
