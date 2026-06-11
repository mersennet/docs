// Concatenates all docs content into public/llms-full.txt for AI consumers.
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { globSync } from 'glob';

const files = globSync('src/content/docs/**/*.{md,mdx}').sort();
let out = '# Mersennet Documentation — full content\n\n';
for (const f of files) {
  const raw = readFileSync(f, 'utf8');
  const slug = f.replace('src/content/docs/', '/').replace(/\.(md|mdx)$/, '/').replace('/index/', '/');
  out += `\n\n---\nsource: https://docs.mersennet.com${slug}\n---\n\n` + raw.replace(/^---\n[\s\S]*?\n---\n/, '');
}
mkdirSync('public', { recursive: true });
writeFileSync('public/llms-full.txt', out);
console.log(`llms-full.txt: ${files.length} pages, ${(out.length/1024).toFixed(0)} KB`);
