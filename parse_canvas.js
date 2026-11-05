const fs = require('fs');
const html = fs.readFileSync('a24_fresh.html', 'utf8');

const canvasIdx = html.indexOf('data-disc-canvas=""');
if (canvasIdx !== -1) {
  console.log(html.slice(canvasIdx, canvasIdx + 2500));
}

// Also check the bottom or any other sections in main
const mainIdx = html.indexOf('<main');
const mainEnd = html.indexOf('</main>');
console.log('Sections inside main:');
const mainContent = html.slice(mainIdx, mainEnd);
const secMatches = [...mainContent.matchAll(/<section[^>]*id=["']([^"']+)["'][^>]*>/gi)].map(m => m[0]);
console.log(secMatches);
