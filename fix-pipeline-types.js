const fs = require('fs');
const path = require('path');

// Lista de arquivos que precisam de correção de tipos de pipeline
const filesToFix = [
  'src/app/api/cafes/analytics/customer-acquisition/route.ts',
  'src/app/api/cafes/analytics/fees/route.ts',
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
    
    // Adicionar import do PipelineStage se não existir
    if (!content.includes('import { PipelineStage }')) {
      content = content.replace(
        "import mongoose from 'mongoose';",
        "import mongoose from 'mongoose';\nimport { PipelineStage } from 'mongoose';"
      );
    }
    
    // Corrigir tipo do pipeline
    content = content.replace(
      /const pipeline: Record<string, unknown>\[\] = \[/g,
      'const pipeline: PipelineStage[] = ['
    );
    
    // Salvar arquivo corrigido
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Fixed ${filePath}`);
  } else {
    console.log(`❌ File not found: ${filePath}`);
  }
});

console.log('🎉 Pipeline types fixed!');
