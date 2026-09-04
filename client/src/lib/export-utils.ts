import type { Configuration, Statistics } from "@shared/schema";

export function exportToExcel(data: Configuration[], filename: string) {
  // Simple CSV export since we can't use ExcelJS on client side easily
  const csvData = generateCSV(data);
  downloadFile(csvData, filename.replace('.xlsx', '.csv'), 'text/csv');
}

export function exportToPDF(configurations: Configuration[], statistics: Statistics, filename: string) {
  // Generate a comprehensive PDF report
  const pdfContent = generatePDFReport(configurations, statistics);
  
  // For now, we'll create a detailed HTML report that can be printed as PDF
  const htmlReport = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Battery Configuration Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #2563eb; text-align: center; }
        .summary { background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f8f9fa; }
        .voltage-badge { padding: 2px 8px; border-radius: 4px; font-weight: bold; }
        .voltage-0 { background: #f3f4f6; color: #374151; }
        .voltage-4 { background: #dbeafe; color: #1d4ed8; }
        .voltage-8 { background: #d1fae5; color: #059669; }
        .voltage-12 { background: #d1fae5; color: #059669; }
        .voltage-16 { background: #fef3c7; color: #d97706; }
      </style>
    </head>
    <body>
      ${pdfContent}
    </body>
    </html>
  `;
  
  downloadFile(htmlReport, filename.replace('.pdf', '.html'), 'text/html');
}

function generateCSV(data: Configuration[]): string {
  // Headers with all 12 individual switches, voltage class, and combination type
  const headers = [
    'Config ID',
    'R1A', 'R1B', 'R1C',
    'R2A', 'R2B', 'R2C',
    'R3A', 'R3B', 'R3C',
    'R4A', 'R4B', 'R4C',
    'Voltage',
    'Voltage Class',
    'Combination Type',
    'Active Cells'
  ];
  
  const rows = data.map(config => {
    // Parse switch states from the format "101 001 100 101"
    const switchArray = parseSwitchStates(config.switchStates);
    
    return [
      config.configId,
      ...switchArray.map(s => s ? '1' : '0'), // All 12 switches as individual columns
      config.voltage,
      config.voltageGroup,
      config.connectionType,
      config.activeCells
    ];
  });
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function parseSwitchStates(switchStates: string): boolean[] {
  // Convert "101 001 100 101" to array of 12 booleans
  const states = switchStates.replace(/\s/g, '').split('').map(s => s === '1');
  return states;
}

function generatePDFReport(configurations: Configuration[], statistics: Statistics): string {
  const totalConfigs = configurations.length;
  const voltageDistribution = statistics.distribution
    .map(d => `<tr><td>${d.voltage}V</td><td>${d.count}</td><td>${d.percentage}%</td></tr>`)
    .join('');
  
  const sampleConfigs = configurations
    .slice(0, 20) // First 20 configurations
    .map(config => `
      <tr>
        <td>${config.configId}</td>
        <td style="font-family: monospace;">${config.switchStates}</td>
        <td><span class="voltage-badge voltage-${config.voltage.toString().replace('.', '')}">${config.voltage}V</span></td>
        <td>${config.voltageGroup}</td>
        <td>${config.connectionType}</td>
        <td>${config.activeCells}</td>
      </tr>
    `)
    .join('');
  
  return `
    <h1>Battery Configuration Simulator Report</h1>
    
    <div class="summary">
      <h2>Summary</h2>
      <p><strong>Total Configurations:</strong> ${totalConfigs.toLocaleString()}</p>
      <p><strong>Battery Cells:</strong> 4 cells × 4V each</p>
      <p><strong>Total Switches:</strong> 12 (3 per cell)</p>
      <p><strong>Possible Combinations:</strong> 2¹² = 4,096</p>
      <p><strong>Report Generated:</strong> ${new Date().toLocaleString()}</p>
    </div>
    
    <h2>Voltage Distribution</h2>
    <table>
      <thead>
        <tr><th>Voltage</th><th>Count</th><th>Percentage</th></tr>
      </thead>
      <tbody>
        ${voltageDistribution}
      </tbody>
    </table>
    
    <h2>Sample Configurations (First 20)</h2>
    <table>
      <thead>
        <tr>
          <th>Config ID</th>
          <th>Switch States</th>
          <th>Voltage</th>
          <th>Voltage Group</th>
          <th>Connection Type</th>
          <th>Active Cells</th>
        </tr>
      </thead>
      <tbody>
        ${sampleConfigs}
      </tbody>
    </table>
    
    <div class="summary">
      <h2>Analysis Notes</h2>
      <ul>
        <li>Each battery cell provides 4V when connected</li>
        <li>Switches determine series vs parallel connections</li>
        <li>Maximum voltage: 16V (all 4 cells in series)</li>
        <li>Minimum voltage: 0V (all switches off)</li>
        <li>Most common configuration: 8V (mixed series/parallel)</li>
      </ul>
    </div>
  `;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportCurrentConfiguration(
  switches: boolean[],
  voltage: number,
  configId: string,
  format: 'csv' | 'json'
) {
  const config = {
    configId,
    switches: switches.map(s => s ? 1 : 0),
    switchStates: formatSwitchStates(switches),
    voltage,
    timestamp: new Date().toISOString()
  };
  
  if (format === 'csv') {
    const csvContent = 'Config ID,Switch States,Voltage,Timestamp\n' +
      `${config.configId},"${config.switchStates}",${config.voltage},${config.timestamp}`;
    downloadFile(csvContent, `config_${configId.replace('#', '')}.csv`, 'text/csv');
  } else {
    const jsonContent = JSON.stringify(config, null, 2);
    downloadFile(jsonContent, `config_${configId.replace('#', '')}.json`, 'application/json');
  }
}

function formatSwitchStates(switches: boolean[]): string {
  const groups = [];
  for (let i = 0; i < 4; i++) {
    const cellSwitches = switches.slice(i * 3, (i + 1) * 3);
    groups.push(cellSwitches.map(s => s ? '1' : '0').join(''));
  }
  return groups.join(' ');
}

// Export function for downloading chart images
export function downloadChart(chartId: string, filename: string) {
  const chartElement = document.getElementById(chartId);
  if (!chartElement) {
    console.error(`Chart element with id ${chartId} not found`);
    return;
  }

  // For SVG charts, we can directly convert to PNG
  const svgElement = chartElement.querySelector('svg');
  if (svgElement) {
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      });
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }
}
