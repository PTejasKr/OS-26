const https = require('https');
const fs = require('fs');

https.get('https://a24.raviklaassens.com/production/the-brutalist', { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Detail Status:', res.statusCode, 'Length:', data.length);
    fs.writeFileSync('a24_detail.html', data);
  });
}).on('error', err => console.error(err));
