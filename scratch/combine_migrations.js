const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
const files = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql') && f.startsWith('00') && !f.startsWith('0001_') && f !== 'all_migrations_combined.sql')
  .sort();

let combinedSQL = `-- =========================================================================\n`;
combinedSQL += `-- COMBINED IDEMPOTENT MIGRATIONS (0002 to 0013)\n`;
combinedSQL += `-- Generated on ${new Date().toISOString()}\n`;
combinedSQL += `-- =========================================================================\n\n`;

files.forEach(file => {
  const filePath = path.join(migrationsDir, file);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  combinedSQL += `-- =========================================================================\n`;
  combinedSQL += `-- START MIGRATION: ${file}\n`;
  combinedSQL += `-- =========================================================================\n\n`;
  combinedSQL += fileContent;
  combinedSQL += `\n\n-- =========================================================================\n`;
  combinedSQL += `-- END MIGRATION: ${file}\n`;
  combinedSQL += `-- =========================================================================\n\n\n`;
});

const outputPath = path.join(migrationsDir, 'all_migrations_combined.sql');
fs.writeFileSync(outputPath, combinedSQL, 'utf8');
console.log(`Successfully combined ${files.length} migrations into: ${outputPath}`);
