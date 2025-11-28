'use client';

import { migrateData } from '@/lib/migration';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

export default function MigrationPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleMigration = async () => {
    setIsRunning(true);
    setLogs([]);
    setResult('');

    const response = await migrateData();

    setLogs(response.logs);
    if (response.success) {
      setResult('Migration completed successfully!');
    } else {
      setResult(`Migration failed: ${response.error}`);
    }

    setIsRunning(false);
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Database Migration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Click the button below to migrate data from the source project to the destination project.
          </p>
          <Button onClick={handleMigration} disabled={isRunning}>
            {isRunning ? 'Migrating...' : 'Start Migration'}
          </Button>

          {logs.length > 0 && (
            <div className="mt-4 rounded-md bg-gray-100 p-4 dark:bg-gray-800">
              <h3 className="mb-2 font-semibold">Migration Logs:</h3>
              <pre className="whitespace-pre-wrap text-sm">
                {logs.join('\n')}
              </pre>
            </div>
          )}

          {result && (
            <p className="mt-4 font-bold">{result}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
