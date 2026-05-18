const fs = require('fs');
const path = require('path');

const migrationsDir = __dirname;
if (!fs.existsSync(migrationsDir)) {
  console.error("Migrations directory not found:", migrationsDir);
  process.exit(1);
}

const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

files.forEach(file => {
  const filePath = path.join(migrationsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  console.log(`Processing file: ${file}...`);

  // 1. Clean existing DROP POLICY IF EXISTS
  content = content.replace(/DROP POLICY\s+IF\s+EXISTS\s+(?:"[^"]+"|\w+)\s+ON\s+[a-zA-Z0-9_\.]+;\s*/gi, '');

  // 2. Prepend DROP POLICY IF EXISTS to CREATE POLICY
  // Matches: CREATE POLICY "name" ON table OR CREATE POLICY name ON table
  content = content.replace(/CREATE POLICY\s+(?:"([^"]+)"|([a-zA-Z_]\w*))\s+ON\s+([a-zA-Z0-9_\.]+)/gi, (match, p1, p2, table) => {
    const name = p1 || p2;
    return `DROP POLICY IF EXISTS "${name}" ON ${table};\n${match}`;
  });

  // 3. Clean existing DROP TRIGGER IF EXISTS
  content = content.replace(/DROP TRIGGER\s+IF\s+EXISTS\s+\w+\s+ON\s+[a-zA-Z0-9_\.]+;\s*/gi, '');

  // 4. Prepend DROP TRIGGER IF EXISTS to CREATE TRIGGER
  // Matches: CREATE TRIGGER trigger_name [BEFORE|AFTER] ... ON table_name
  content = content.replace(/CREATE TRIGGER\s+([a-zA-Z_]\w*)\s+(?:BEFORE|AFTER)\s+(?:[a-zA-Z_][\w\sOR]+)\s+ON\s+([a-zA-Z0-9_\.]+)/gi, (match, triggerName, table) => {
    return `DROP TRIGGER IF EXISTS ${triggerName} ON ${table};\n${match}`;
  });

  // 5. Make CREATE TABLE idempotent
  // Replace "CREATE TABLE [public.]table_name" with "CREATE TABLE IF NOT EXISTS [public.]table_name"
  content = content.replace(/CREATE TABLE\s+(?!IF\s+NOT\s+EXISTS\s+)([a-zA-Z0-9_\.]+)/gi, 'CREATE TABLE IF NOT EXISTS $1');

  // 6. Make CREATE INDEX / CREATE UNIQUE INDEX idempotent
  content = content.replace(/CREATE\s+(UNIQUE\s+)?INDEX\s+(?!IF\s+NOT\s+EXISTS\s+)([a-zA-Z0-9_\.]+)/gi, (match, unique, indexName) => {
    return `CREATE ${unique || ''}INDEX IF NOT EXISTS ${indexName}`;
  });

  // 7. Make ALTER TABLE ... ADD COLUMN idempotent
  // Matches: ADD COLUMN [IF NOT EXISTS]
  content = content.replace(/ADD COLUMN\s+(?!IF\s+NOT\s+EXISTS\s+)/gi, 'ADD COLUMN IF NOT EXISTS ');

  // 8. Handle INSERT INTO plans ON CONFLICT DO NOTHING
  if (file.includes('0003')) {
    // Only append ON CONFLICT (id) DO NOTHING if not already there
    if (!content.includes('ON CONFLICT (id) DO NOTHING')) {
      content = content.replace(/('pro', 'Pro', 45000, [^;]+);/gi, "$1 ON CONFLICT (id) DO NOTHING;");
    }
  }

  // 9. Handle INSERT INTO business_types ON CONFLICT DO NOTHING
  if (file.includes('0012')) {
    if (!content.includes('ON CONFLICT (slug) DO NOTHING')) {
      content = content.replace(/('lawyer', 'Law Office', [^;]+);/gi, "$1 ON CONFLICT (slug) DO NOTHING;");
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Successfully updated ${file}!`);
});

console.log("All migrations successfully transformed into idempotent SQL scripts!");
