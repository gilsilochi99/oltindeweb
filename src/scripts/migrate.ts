import { migrateData } from '../lib/migration';

async function runMigration() {
  console.log('Starting migration from terminal...');
  const result = await migrateData();
  console.log('--- MIGRATION SCRIPT FINISHED ---');
  console.log(`Success: ${result.success}`);
  console.log('Logs:');
  console.log(result.logs.join('\n'));
  if (result.error) {
    console.error(`Error: ${result.error}`);
  }
}

runMigration();
