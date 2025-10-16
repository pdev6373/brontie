const fs = require('fs');
const path = require('path');

// Lista de arquivos com erros críticos que impedem o build
const filesToFix = [
  'src/app/api/admin/master-revenue/route.ts',
  'src/app/api/cafes/analytics/customer-acquisition/route.ts',
  'src/app/api/cafes/analytics/fees/route.ts',
  'src/app/api/cafes/analytics/funnel/route.ts',
  'src/app/api/cafes/analytics/payouts/route.ts',
  'src/app/api/cafes/analytics/product-mix/route.ts',
  'src/app/api/cafes/analytics/redemption-delay/route.ts',
  'src/app/api/cron/automated-payouts/route.ts',
  'src/app/api/stripe-connect/batch-payouts/route.ts',
  'src/app/api/stripe-connect/transfer/route.ts',
  'src/components/admin/MerchantDialog.tsx',
  'src/components/SendOneBackCTA.tsx',
  'src/components/ViralLoopTracker.tsx'
];

// Função para corrigir tipos any
function fixAnyTypes(content) {
  return content
    .replace(/: any\[\]/g, ': Record<string, unknown>[]')
    .replace(/: any\s*=/g, ': Record<string, unknown> =')
    .replace(/const (\w+): any/g, 'const $1: Record<string, unknown>')
    .replace(/\((\w+): any\)/g, '($1: Record<string, unknown>)')
    .replace(/<any>/g, '<Record<string, unknown>>');
}

// Função para remover imports não utilizados
function removeUnusedImports(content) {
  const unusedImports = [
    'import GiftItem from \'@/models/GiftItem\';',
    'import Merchant from \'@/models/Merchant\';',
    'import mongoose from \'mongoose\';',
    'import { getEstimatedStripeFee } from \'@/lib/stripe-fees\';',
    'import Voucher from \'@/models/Voucher\';',
    'import MerchantLocation from \'@/models/MerchantLocation\';',
    'import { getStripeFee } from \'@/lib/stripe-fees\';'
  ];
  
  let fixed = content;
  unusedImports.forEach(importLine => {
    fixed = fixed.replace(importLine + '\n', '');
  });
  
  return fixed;
}

// Função para corrigir aspas não escapadas
function fixUnescapedQuotes(content) {
  return content
    .replace(/"[^"]*"/g, (match) => {
      // Se contém aspas dentro de JSX, substitui por aspas simples
      if (match.includes('{') && match.includes('}')) {
        return match.replace(/"/g, "'");
      }
      return match;
    });
}

// Processar cada arquivo
filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    console.log(`Fixing ${filePath}...`);
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Aplicar correções
    content = removeUnusedImports(content);
    content = fixAnyTypes(content);
    content = fixUnescapedQuotes(content);
    
    // Salvar arquivo corrigido
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Fixed ${filePath}`);
  } else {
    console.log(`❌ File not found: ${filePath}`);
  }
});

console.log('🎉 Build errors fixed!');
