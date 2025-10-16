const fs = require('fs');
const path = require('path');

// Lista de arquivos que precisam de correção de imports
const filesToFix = [
  {
    file: 'src/app/api/cafes/analytics/customer-acquisition/route.ts',
    imports: ['import Voucher from \'@/models/Voucher\';\nimport mongoose from \'mongoose\';']
  },
  {
    file: 'src/app/api/cafes/analytics/funnel/route.ts',
    imports: ['import Voucher from \'@/models/Voucher\';\nimport mongoose from \'mongoose\';']
  },
  {
    file: 'src/app/api/cafes/analytics/payouts/route.ts',
    imports: ['import PayoutItem from \'@/models/PayoutItem\';\nimport mongoose from \'mongoose\';']
  },
  {
    file: 'src/app/api/cafes/analytics/product-mix/route.ts',
    imports: ['import Voucher from \'@/models/Voucher\';\nimport mongoose from \'mongoose\';']
  },
  {
    file: 'src/app/api/cafes/analytics/redemption-delay/route.ts',
    imports: ['import Voucher from \'@/models/Voucher\';\nimport mongoose from \'mongoose\';']
  }
];

// Processar cada arquivo
filesToFix.forEach(({ file: filePath, imports }) => {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    console.log(`Fixing ${filePath}...`);
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Adicionar imports se não existirem
    imports.forEach(importLine => {
      if (!content.includes(importLine.split('\n')[0])) {
        content = content.replace(
          "import { connectToDatabase } from '@/lib/mongodb';",
          `import { connectToDatabase } from '@/lib/mongodb';\n${importLine}`
        );
      }
    });
    
    // Salvar arquivo corrigido
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Fixed ${filePath}`);
  } else {
    console.log(`❌ File not found: ${filePath}`);
  }
});

console.log('🎉 Imports fixed!');
