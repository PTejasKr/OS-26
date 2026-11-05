const fs = require('fs');
const css = fs.readFileSync('a24_styles.css', 'utf8');
const vars = [...css.matchAll(/--([a-zA-Z0-9_-]+):\s*([^;}]+)/g)].map(m => `--${m[1]}: ${m[2]}`);
console.log('Total vars:', vars.length);
console.log(vars.filter(v => /color|swatch|theme|black|white|grey|brand/i.test(v)).slice(0, 40));
