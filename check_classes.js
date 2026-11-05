const fs = require('fs');
const css = fs.readFileSync('a24_styles.css', 'utf8');

const targets = [
  'hero',
  'experience_wrap',
  'experience_info',
  'info-content',
  'info-content_panel',
  'testimonial_wrap',
  'testimonial',
  'experience-canvas',
  'heading-s',
  'heading-l',
  'subheading-xs',
  'paragraph-m',
  'divider-horizontal',
  'nav-center',
  'nav-container',
  'transition'
];

targets.forEach(t => {
  const reg = new RegExp(`\\.${t}[^{]*\\{[^}]*\\}`, 'g');
  const matches = css.match(reg);
  if (matches) {
    console.log(`=== .${t} ===`);
    matches.slice(0, 3).forEach(m => console.log(m));
  }
});
