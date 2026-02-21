const fs = require('fs');
const path = require('path');

function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        processDirectory(fullPath);
      }
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const originalContent = content;
      
      content = content.replace(/text-\[(\d+)px\]/g, (match, p1) => {
        const newSize = parseInt(p1, 10) - 1;
        return `text-[${newSize}px]`;
      });
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory('./src');
processDirectory('./components');
if (fs.existsSync('./App.tsx')) {
    let content = fs.readFileSync('./App.tsx', 'utf8');
    const originalContent = content;
    content = content.replace(/text-\[(\d+)px\]/g, (match, p1) => {
      const newSize = parseInt(p1, 10) - 1;
      return `text-[${newSize}px]`;
    });
    if (content !== originalContent) {
      fs.writeFileSync('./App.tsx', content, 'utf8');
      console.log(`Updated ./App.tsx`);
    }
}
