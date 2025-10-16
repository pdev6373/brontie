const fs = require('fs');
const path = require('path');

// Lista de arquivos que precisam de correção
const filesToFix = [
  'src/app/api/cafes/analytics/customer-acquisition/route.ts',
  'src/app/api/cafes/analytics/funnel/route.ts',
  'src/app/api/cafes/analytics/payouts/route.ts',
  'src/app/api/cafes/analytics/product-mix/route.ts',
  'src/app/api/cafes/analytics/redemption-delay/route.ts'
];

// Processar cada arquivo
filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    console.log(`Fixing ${filePath}...`);
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Corrigir mongoose.Types.ObjectId para usar any
    content = content.replace(
      /new mongoose\.Types\.ObjectId\(/g,
      'new (mongoose as any).Types.ObjectId('
    );
    
    // Salvar arquivo corrigido
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Fixed ${filePath}`);
  } else {
    console.log(`❌ File not found: ${filePath}`);
  }
});

console.log('🎉 Mongoose any types fixed!');
