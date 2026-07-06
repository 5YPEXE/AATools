const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/transfer/three-leg-combinations?page=1&limit=5',
  method: 'GET'
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('API RESPONSE STATUS:', res.statusCode);
      console.log('Total combinations found:', result.total);
      console.log('Page:', result.page, 'of', result.totalPages);
      console.log('First 3 results:');
      result.results.slice(0, 3).forEach((r, idx) => {
        console.log(`  ${idx + 1}. Zone: ${r.zoneA} -> ${r.zoneB} -> ${r.zoneC}`);
        console.log(`     Rules: ${r.rule1} -> ${r.rule2}`);
        console.log(`     Line 1 samples: ${r.sampleA.slice(0, 50)}...`);
      });
    } catch(e) {
      console.log('Error parsing response:', e.message);
      console.log('Raw data:', data);
    }
  });
});

req.on('error', error => {
  console.error('API Error:', error.message);
});

req.end();
