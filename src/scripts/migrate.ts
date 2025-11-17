import { fixTimestamps } from '../lib/migration';

async function runMigration() {
  console.log('Starting timestamp fix from terminal...');
  const result = await fixTimestamps();
  console.log('--- TIMESTAMP FIX SCRIPT FINISHED ---');
  console.log(`Success: ${result.success}`);
  console.log('Logs:');
  console.log(result.logs.join('\n'));
  if (result.error) {
    console.error(`Error: ${result.error}`);
  }
}

runMigration();
