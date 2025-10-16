const fs = require('fs');
const path = require('path');

// Lista de arquivos que precisam de correção
const filesToFix = [
  'src/app/api/admin/master-revenue/route.ts',
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
    
    // Remover import do PipelineStage
    content = content.replace(/import { PipelineStage } from 'mongoose';\n?/g, '');
    
    // Corrigir tipo do pipeline para any[]
    content = content.replace(/const pipeline: PipelineStage\[\] = \[/g, 'const pipeline: any[] = [');
    content = content.replace(/const timeSeriesPipeline: PipelineStage\[\] = \[/g, 'const timeSeriesPipeline: any[] = [');
    content = content.replace(/const cohortPipeline: PipelineStage\[\] = \[/g, 'const cohortPipeline: any[] = [');
    
    // Salvar arquivo corrigido
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Fixed ${filePath}`);
  } else {
    console.log(`❌ File not found: ${filePath}`);
  }
});

console.log('🎉 Pipeline types fixed to any[]!');
