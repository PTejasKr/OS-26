const fs = require('fs');
const html = fs.readFileSync('a24_fresh.html', 'utf8');

const heroIdx = html.indexOf('id="section_hero"');
if (heroIdx !== -1) {
  console.log(html.slice(heroIdx, heroIdx + 4000));
}
