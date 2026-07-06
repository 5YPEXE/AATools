const http = require('http');

function checkEndpoint(url, label, customTest = () => {}) {
  http.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log(`\n--- ${label} ---`);
      console.log('Status Code:', res.statusCode);
      console.log('Content-Type:', res.headers['content-type']);
      if (res.headers['content-disposition']) {
        console.log('Content-Disposition:', res.headers['content-disposition']);
      }
      try {
        if (res.headers['content-type'].includes('application/json')) {
          const json = JSON.parse(data);
          console.log('Total Results:', json.total);
          console.log('Results on Page:', json.results?.length);
          if (json.results && json.results.length > 0) {
            console.log('First Item simulated fares:', {
              zones: `${json.results[0].zoneA} -> ${json.results[0].zoneB} -> ${json.results[0].zoneC}`,
              fares: `${json.results[0].fareA/100} -> ${json.results[0].tf1/100} -> ${json.results[0].tf2/100}`,
              total: json.results[0].total/100,
              savings: json.results[0].savings/100,
              hasDiffApplied: json.results[0].hasDiffApplied
            });
          }
          customTest(json);
        } else {
          console.log('First 200 chars of data:', data.slice(0, 200));
        }
      } catch (e) {
        console.error('Failed to parse:', e.message);
      }
    });
  }).on('error', (err) => {
    console.error(`${label} Request Failed:`, err.message);
  });
}

// 1. Check all combinations
checkEndpoint('http://localhost:3001/api/transfer/three-leg-combinations?limit=3', 'All Combinations');

// 2. Check combinations with fare difference
checkEndpoint('http://localhost:3001/api/transfer/three-leg-combinations?limit=3&filter=diff', 'Fare Difference Filtered Combinations', (json) => {
  if (json.results && json.results.length > 0) {
    const allHaveDiff = json.results.every(r => r.hasDiffApplied);
    console.log('Do all items have fare difference applied?', allHaveDiff ? 'YES (CORRECT)' : 'NO (ERROR)');
  }
});

// 3. Check CSV Export
checkEndpoint('http://localhost:3001/api/transfer/export-simulated-csv', 'CSV Simulated Fares Export');
