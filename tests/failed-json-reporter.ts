import * as fs from 'fs';
import * as path from 'path';
import { Reporter, TestCase, TestResult } from '@playwright/test';

class FailedJsonReporter implements Reporter {
  private failedTests: any[] = [];

  // This hook runs after every single test completes
  onTestEnd(test: TestCase, result: TestResult) {
    // Capture failures and timeouts, ignore passing or skipped tests
    if (result.status !== 'passed' && result.status !== 'skipped') {
      this.failedTests.push({
        title: test.title,
        file: path.relative(process.cwd(), test.location.file),
        line: test.location.line,
        project: test.projectName,
        status: result.status,
        durationMs: result.duration,
        error: result.error?.message || 'Unknown error',
      });
    }
  }

  // This hook runs after the entire test suite completes
  async onEnd() {
    // Path points exactly to your tests/ folder
    const outputPath = path.join(process.cwd(), 'tests', 'failed-results.json');

    try {
      // Overwrites the file with the fresh failure array
      fs.writeFileSync(outputPath, JSON.stringify(this.failedTests, null, 2));
      console.log(`\n📄 Only failed results stored in: ${outputPath}`);
    } catch (error) {
      console.error(`\n❌ Failed to write JSON results file:`, error);
    }
  }
}

export default FailedJsonReporter;
