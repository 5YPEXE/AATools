const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/transfer/scenario?fromLine=507&toLine=902&cardType=2&hour=9&minute=0&weekday=1',
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
      console.log('fromLine:', result.fromLine.name, 'zone:', result.fromLine.zone_id);
      console.log('toLine:', result.toLine.name, 'zone:', result.toLine.zone_id);
      console.log('fromFare:', result.fromFare);
      console.log('toFare:', result.toFare);
      console.log('transferFare:', result.transferFare);
      console.log('transferType:', result.transferType);
      console.log('totalFare:', result.totalFare);
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
