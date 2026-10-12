import { randomUUID } from 'node:crypto';
import type {
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
  TestStep,
} from '@playwright/test/reporter';
import { Pool } from 'pg';

type FinalTestResult = {
  test: TestCase;
  result: TestResult;
};

function serializeSteps(steps: TestStep[]): object[] {
  return steps.map((step) => ({
    name: step.title,
    status: step.error ? 'FAILED' : 'PASSED',
    durationMs: step.duration,
    error: step.error?.message,
    steps: serializeSteps(step.steps),
  }));
}

export default class WrightTestReporter implements Reporter {
  private readonly finalResults = new Map<string, FinalTestResult>();

  onTestEnd(test: TestCase, result: TestResult): void {
    this.finalResults.set(test.id, { test, result });
  }

  async onEnd(_result: FullResult): Promise<void> {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) return;

    const projectName = process.env.WRIGHTTEST_PROJECT ?? 'Misa';
    const environmentName = process.env.TEST_ENVIRONMENT ?? 'Misa Production';
    const baseUrl = process.env.MISA_BASE_URL ?? 'https://misa.baxic.ru';
    const pool = new Pool({
      connectionString,
      ssl: process.env.WRIGHTTEST_DATABASE_SSL === 'false'
        ? false
        : { rejectUnauthorized: false },
    });

    try {
      const projectResult = await pool.query<{ id: string }>(
        'SELECT "id" FROM "Project" WHERE "name" = $1 ORDER BY "createdAt" LIMIT 1',
        [projectName],
      );
      const projectId = projectResult.rows[0]?.id;
      if (!projectId) throw new Error(`WrightTest project not found: ${projectName}`);

      const environmentResult = await pool.query<{ id: string }>(
        'SELECT "id" FROM "Environment" WHERE "projectId" = $1 AND "name" = $2 ORDER BY "createdAt" LIMIT 1',
        [projectId, environmentName],
      );
      const environmentId = environmentResult.rows[0]?.id ?? null;

      for (const { test, result } of this.finalResults.values()) {
        const fullTitle = test.titlePath().filter(Boolean).join(' › ');
        const name = `E2E: ${fullTitle}`.slice(0, 200);
        const testResult = await pool.query<{ id: string }>(
          'SELECT "id" FROM "Test" WHERE "projectId" = $1 AND "name" = $2 ORDER BY "createdAt" LIMIT 1',
          [projectId, name],
        );
        let testId = testResult.rows[0]?.id;

        if (!testId) {
          testId = randomUUID();
          await pool.query(
            `INSERT INTO "Test"
              ("id", "name", "url", "device", "steps", "testData", "environmentId", "projectId", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, NOW(), NOW())`,
            [testId, name, baseUrl, 'Desktop', '[]', '[]', environmentId, projectId],
          );
        }

        const passed = result.status === 'passed';
        const finishedAt = new Date(result.startTime.getTime() + result.duration);
        await pool.query(
          `INSERT INTO "TestRun"
            ("id", "status", "startedAt", "finishedAt", "durationMs", "error",
             "screenshots", "stepResults", "testId", "environmentId")
           VALUES ($1, $2::"RunStatus", $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10)`,
          [
            randomUUID(),
            passed ? 'PASSED' : 'FAILED',
            result.startTime,
            finishedAt,
            result.duration,
            result.error?.message ?? (passed ? null : `Playwright status: ${result.status}`),
            '[]',
            JSON.stringify(serializeSteps(result.steps)),
            testId,
            environmentId,
          ],
        );
      }

      console.log(`Published ${this.finalResults.size} Playwright result(s) to WrightTest`);
    } finally {
      await pool.end();
    }
  }
}
