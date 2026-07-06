const http = require('http');

const url = 'http://localhost:3001/api/transfer/scenario?fromLine=201&toLine=354&thirdLine=110&cardType=1&hour=9&minute=0&weekday=1';

http.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('--- TEST RESULTS ---');
      console.log('From Line 201 Fare:', result.fromFare / 100, '₺');
      console.log('To Line 354 Transfer Fare:', result.transferFare / 100, '₺');
      if (result.secondTransfer) {
        console.log('Third Line 110 Transfer Fare:', result.secondTransfer.transferFare / 100, '₺');
      }
      console.log('Total Fare Calculated:', result.totalFare / 100, '₺');
      console.log('Expected: 35.00 + 47.50 + 17.50 = 100.00 ₺');
    } catch (e) {
      console.error('Failed to parse response:', e.message);
      console.log('Raw data:', data);
    }
  });
}).on('error', (err) => {
  console.error('Request failed:', err.message);
});
