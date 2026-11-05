const fs = require('fs');
const html = fs.readFileSync('a24_fresh.html', 'utf8');
const scriptMatches = [...html.matchAll(/<script[\s\S]*?<\/script>/gi)].map(m => m[0]);
console.log('Script tags count:', scriptMatches.length);
scriptMatches.forEach((s, i) => console.log(`Script ${i}:`, s.slice(0, 300)));
