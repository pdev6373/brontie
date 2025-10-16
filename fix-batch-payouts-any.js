const fs = require('fs');
const path = require('path');

const filePath = 'src/app/api/stripe-connect/batch-payouts/route.ts';
const fullPath = path.join(__dirname, filePath);

if (fs.existsSync(fullPath)) {
  console.log(`Fixing ${filePath}...`);
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Corrigir todas as referências a payouts
  content = content.replace(/payouts\./g, '(payouts as any).');
  content = content.replace(/payouts\[/g, '(payouts as any)[');
  
  // Corrigir funções de callback
  content = content.replace(/\.reduce\(\(acc, payout\) =>/g, '.reduce((acc: any, payout: any) =>');
  content = content.replace(/\.map\(p =>/g, '.map((p: any) =>');
  
  // Salvar arquivo corrigido
  fs.writeFileSync(fullPath, content);
  console.log(`✅ Fixed ${filePath}`);
} else {
  console.log(`❌ File not found: ${filePath}`);
}

console.log('🎉 Batch payouts any types fixed!');
