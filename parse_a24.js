const fs = require('fs');
const html = fs.readFileSync('a24_fresh.html', 'utf8');

// Find all script tags, stylesheets, and main containers
const scripts = [...html.matchAll(/<script[^>]*src=["']([^"']+)["'][^>]*>/g)].map(m => m[1]);
const links = [...html.matchAll(/<link[^>]*href=["']([^"']+)["'][^>]*>/g)].map(m => m[1]);
console.log('Scripts:', scripts);
console.log('Links:', links);

const headings = [...html.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
console.log('Headings:', headings.slice(0, 30));

const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
if (bodyMatch) {
  const body = bodyMatch[1];
  const tags = [...body.matchAll(/<([a-z0-9-]+)[^>]*class=["']([^"']+)["']/gi)].map(m => `<${m[1]} class="${m[2]}">`).slice(0, 35);
  console.log('Top elements:\n', tags.join('\n'));
}
