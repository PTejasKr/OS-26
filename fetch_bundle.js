const https = require('https');
const fs = require('fs');

https.get('https://a24.raviklaassens.com/_astro/ExportPage.astro_astro_type_script_index_0_lang.DQlUkOwJ.js', {
  headers: { 'User-Agent': 'Mozilla/5.0' }
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Script download status:', res.statusCode, 'Length:', data.length);
    fs.writeFileSync('a24_bundle.js', data);
  });
}).on('error', err => console.error(err));
