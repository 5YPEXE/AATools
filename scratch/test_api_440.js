const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/transfer/scenario?fromLine=440&toLine=902&thirdLine=237&cardType=1&hour=9&minute=0&weekday=1',
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
      console.log('fromLine:', result.fromLine.name, 'fare:', result.fromFare);
      console.log('toLine:', result.toLine.name, 'fare:', result.toFare, 'transferFare:', result.transferFare, 'type:', result.transferType.label_tr);
      console.log('thirdLine:', result.thirdLine.name, 'fare:', result.thirdFare, 'transferFare:', result.secondTransfer.transferFare, 'type:', result.secondTransfer.transferType.label_tr);
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
