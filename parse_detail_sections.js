const fs = require('fs');
const html = fs.readFileSync('a24_detail.html', 'utf8');

function printSection(id) {
  const idx = html.indexOf(id);
  if (idx !== -1) {
    console.log(`=== ${id} ===\n`, html.slice(idx, idx + 2500));
  }
}

printSection('id="production_hero"');
printSection('id="production_desc"');
printSection('data-scroll-next=""');
