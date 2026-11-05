const fs = require('fs');
const html = fs.readFileSync('a24_detail.html', 'utf8');

const headings = [...html.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
console.log('Detail Headings:', headings);

// Find main sections
const sections = [...html.matchAll(/<(main|section|article)[^>]*class=["']([^"']+)["'][^>]*>/gi)].map(m => m[0]);
console.log('Detail Sections:\n', sections.join('\n'));

// Top classes in body
const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
if (bodyMatch) {
  const body = bodyMatch[1];
  const tags = [...body.matchAll(/<([a-z0-9-]+)[^>]*class=["']([^"']+)["']/gi)].map(m => `<${m[1]} class="${m[2]}">`).slice(0, 45);
  console.log('Detail Top elements:\n', tags.join('\n'));
}
