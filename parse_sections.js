const fs = require('fs');
const html = fs.readFileSync('a24_fresh.html', 'utf8');

// Print main sections
const sections = [...html.matchAll(/<(main|section|header|footer|nav|article)[^>]*class=["']([^"']+)["'][^>]*>/gi)]
  .map(m => m[0]);
console.log('Sections:\n', sections.join('\n'));

// Check what classes exist on discs
const discMatches = [...html.matchAll(/class=["'][^"']*disc[^"']*["']/gi)].map(m => m[0]);
console.log('Disc classes:', [...new Set(discMatches)]);

// Check what JS data or inline templates exist
const dataAttrs = [...html.matchAll(/data-[a-z0-9-]+(=["'][^"']*["'])?/gi)].map(m => m[0]);
console.log('Sample data attrs:', [...new Set(dataAttrs)].slice(0, 30));
