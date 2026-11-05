const fs = require('fs');
const html = fs.readFileSync('a24_fresh.html', 'utf8');

// Find all HTML elements inside #section_hero
const heroMatch = html.match(/<section id="section_hero"[\s\S]*?<\/section>/);
if (heroMatch) {
  console.log('Hero section length:', heroMatch[0].length);
  // print first 4000 chars of hero
  console.log('=== HERO START ===');
  console.log(heroMatch[0].slice(0, 3000));
}
