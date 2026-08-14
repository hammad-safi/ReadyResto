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
