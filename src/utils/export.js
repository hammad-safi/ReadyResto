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

    const printWindow = window.open('', '_blank', 'width=350,height=600');
    if (!printWindow) {
      console.error("Popup blocker prevented KOT print");
      return;
    }

    const ticketsHtml = ordersToPrint.map((order, index) => `
      <div class="ticket" style="${index > 0 ? 'page-break-before: always; margin-top: 20px;' : ''}">
        <h2>KITCHEN TICKET</h2>
        <div class="meta">
          <div><strong>Order:</strong> #${order.id}</div>
          <div><strong>Type:</strong> ${String(order.type).toLowerCase() === "dine-in" ? "Dine-In (Table " + order.table + ")" : (order.type || "TAKEAWAY").toUpperCase()}</div>
          <div><strong>Time:</strong> ${new Date(order.time || Date.now()).toLocaleTimeString()}</div>
          <div><strong>Waiter:</strong> ${order.waiter || 'None'}</div>
        </div>
        <div class="divider"></div>
        ${order.itemsToPrint.map(item => `
          <div class="item">
            <span class="item-name">${item.qty} x ${item.name}</span>
          </div>
          ${item.notes ? `<div class="item-notes">Note: ${item.notes}</div>` : ''}
          ${item.modifiers ? `<div class="item-notes">${item.modifiers}</div>` : ''}
        `).join('')}
        <div class="divider"></div>
        <div style="text-align: center; font-size: 10px;">End of Ticket</div>
      </div>
    `).join('');

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
              font-size: 12px;
            }
            h2 { text-align: center; margin: 0 0 10px 0; font-size: 16px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
            .meta { margin-bottom: 10px; font-size: 11px; }
            .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .item-name { font-weight: bold; }
            .item-notes { font-size: 10px; font-style: italic; margin-left: 10px; margin-bottom: 4px; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
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
