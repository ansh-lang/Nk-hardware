const fs = require('fs');
const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

const startStr = '  // Real Astral CPVC Products from PDF\n  const cpvcProducts: CPVCProduct[] = [\n';
const endStr = '  ];\n\n  // Combine hardcoded and DB products\n  const allProducts = [...cpvcProducts, ...dbProducts];';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const newContent = content.substring(0, startIndex) + 
                     '  // Real Astral CPVC Products from PDF\n  const cpvcProducts: CPVCProduct[] = [];\n\n  // Combine hardcoded and DB products\n  const allProducts = [...cpvcProducts, ...dbProducts];' + 
                     content.substring(endIndex + endStr.length);
  fs.writeFileSync(file, newContent);
  console.log('Successfully removed hardcoded CPVC products.');
} else {
  console.log('Could not find the start or end string.');
}
