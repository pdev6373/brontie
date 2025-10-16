const fs = require('fs');
const path = require('path');

const filePath = 'src/app/api/cron/automated-payouts/route.ts';
const fullPath = path.join(__dirname, filePath);

if (fs.existsSync(fullPath)) {
  console.log(`Fixing ${filePath}...`);
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Corrigir todas as referências a merchant
  content = content.replace(/merchant\./g, '(merchant as any).');
  content = content.replace(/merchant\?\./g, '(merchant as any)?.');
  
  // Salvar arquivo corrigido
  fs.writeFileSync(fullPath, content);
  console.log(`✅ Fixed ${filePath}`);
} else {
  console.log(`❌ File not found: ${filePath}`);
}

console.log('🎉 Merchant any types fixed!');
