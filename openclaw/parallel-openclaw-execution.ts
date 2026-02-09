/**
 * Advanced: Parallel OpenClaw Execution
 *
 * This example demonstrates running multiple OpenClaw instances simultaneously
 * on separate devboxes, each working on independent tasks. This pattern is useful
 * for parallelizing work that would otherwise be sequential.
 *
 * Use Cases:
 * - Multi-repository code analysis
 * - Parallel feature development across microservices
 * - Distributed testing across different environments
 * - Concurrent documentation generation for different modules
 *
 * Security Note: Each devbox is completely isolated. A compromise in one
 * instance cannot affect others or your host machine.
 */

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Runloop from "@runloop/api-client";

interface ParallelTask {
  name: string;
  message: string;
  thinking: "low" | "medium" | "high";
}

interface ParallelExecutionResult {
  taskName: string;
  devboxId: string;
  success: boolean;
  output?: string;
  error?: string;
  preSnapshot: string;
  postSnapshot: string;
  executionTimeMs: number;
}

/**
 * Execute multiple OpenClaw tasks in parallel across separate devboxes.
 * Each devbox is launched from the same base snapshot but operates independently.
 */
async function executeParallelOpenClawTasks(
  baseSnapshotId: string,
  tasks: ParallelTask[],
): Promise<ParallelExecutionResult[]> {
  const client = new Runloop({
    bearerToken: process.env.RUNLOOP_API_KEY,
  });

  console.log(`\n${"=".repeat(70)}`);
  console.log(`PARALLEL OPENCLAW EXECUTION: ${tasks.length} tasks`);
  console.log("=".repeat(70));
  tasks.forEach((task, i) => {
    console.log(`  ${i + 1}. ${task.name}`);
  });
  console.log(`${"=".repeat(70)}\n`);

  // Execute all tasks in parallel
  const taskPromises = tasks.map((task, index) =>
    executeSingleTask(client, baseSnapshotId, task, index),
  );

  // Wait for all tasks to complete
  const results = await Promise.allSettled(taskPromises);

  // Process results
  const finalResults: ParallelExecutionResult[] = results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    return {
      taskName: tasks[index].name,
      devboxId: "failed-to-create",
      success: false,
      error: result.reason.message,
      preSnapshot: "",
      postSnapshot: "",
      executionTimeMs: 0,
    };
  });

  // Print summary
  console.log(`\n${"=".repeat(70)}`);
  console.log("EXECUTION SUMMARY");
  console.log("=".repeat(70));

  const successful = finalResults.filter((r) => r.success).length;
  const failed = finalResults.filter((r) => !r.success).length;

  console.log(`Successful: ${successful}/${tasks.length}`);
  console.log(`Failed: ${failed}/${tasks.length}`);
  console.log("\nDetailed Results:");

  finalResults.forEach((result, i) => {
    const status = result.success ? "OK" : "FAIL";
    const time =
      result.executionTimeMs > 0 ? `(${(result.executionTimeMs / 1000).toFixed(2)}s)` : "";
    console.log(`  ${status} ${result.taskName} ${time}`);
    if (result.success) {
      console.log(`      Devbox: ${result.devboxId}`);
      console.log(`      Pre-snapshot: ${result.preSnapshot}`);
      console.log(`      Post-snapshot: ${result.postSnapshot}`);
    } else {
      console.log(`      Error: ${result.error}`);
    }
  });

  console.log(`${"=".repeat(70)}\n`);

  return finalResults;
}

/**
 * Execute a single OpenClaw task on its own devbox.
 * Internal helper function for parallel execution.
 */
async function executeSingleTask(
  client: Runloop,
  snapshotId: string,
  task: ParallelTask,
  taskIndex: number,
): Promise<ParallelExecutionResult> {
  const startTime = Date.now();
  const taskPrefix = `[Task ${taskIndex + 1}: ${task.name}]`;

  console.log(`${taskPrefix} Starting execution...`);

  // Launch devbox from snapshot
  let devbox = await client.devboxes.create({
    name: `openclaw-parallel-${taskIndex}-${Date.now()}`,
    snapshot_id: snapshotId,
    launch_parameters: {
      resource_size_request: "MEDIUM",
    },
  });

  console.log(`${taskPrefix} Devbox created: ${devbox.id}`);

  // Wait for running state
  while (devbox.status !== "running") {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    devbox = await client.devboxes.retrieve(devbox.id);
  }

  console.log(`${taskPrefix} Devbox running`);

  try {
    // Create pre-execution snapshot
    const preSnapshotName = `parallel-${taskIndex}-pre-${Date.now()}`;
    console.log(`${taskPrefix} 📸 Creating pre-execution snapshot...`);
    const preSnapshot = await client.devboxes.snapshotDisk(devbox.id, {
      name: preSnapshotName,
    });

    // Execute OpenClaw command
    const command = `openclaw agent --message "${task.message}" --thinking ${task.thinking}`;
    console.log(`${taskPrefix} 🤖 Executing OpenClaw command...`);

    const result = await client.devboxes.executeSync(devbox.id, {
      command: command,
    });

    // Create post-execution snapshot (BEST PRACTICE)
    const postSnapshotName = `parallel-${taskIndex}-post-${Date.now()}`;
    console.log(`${taskPrefix} 📸 Creating post-execution snapshot...`);
    const postSnapshot = await client.devboxes.snapshotDisk(devbox.id, {
      name: postSnapshotName,
    });

    console.log(`${taskPrefix} Task completed successfully`);

    // Shutdown devbox
    await client.devboxes.shutdown(devbox.id);
    console.log(`${taskPrefix} 🛑 Devbox shutdown`);

    const executionTime = Date.now() - startTime;

    return {
      taskName: task.name,
      devboxId: devbox.id,
      success: true,
      output: result.stdout,
      preSnapshot: preSnapshot.id,
      postSnapshot: postSnapshot.id,
      executionTimeMs: executionTime,
    };
  } catch (error) {
    console.error(`${taskPrefix} Error during execution:`, error);

    // Attempt cleanup
    try {
      await client.devboxes.shutdown(devbox.id);
    } catch (cleanupError) {
      console.error(`${taskPrefix} ⚠️  Failed to cleanup devbox`);
    }

    throw error;
  }
}

// ============================================================================
// Example Usage: Parallel Feature Development
// ============================================================================

async function parallelFeatureDevelopmentExample() {
  console.log("🦞 Parallel OpenClaw Execution Example\n");

  const baseSnapshotId = process.env.OPENCLAW_SNAPSHOT_ID;

  if (!baseSnapshotId) {
    throw new Error("Please set OPENCLAW_SNAPSHOT_ID environment variable");
  }

  // Define parallel tasks
  const tasks: ParallelTask[] = [
    {
      name: "Authentication Module",
      message:
        "Implement OAuth2 authentication for the user service. Include unit tests and update documentation.",
      thinking: "high",
    },
    {
      name: "Payment Integration",
      message:
        "Add Stripe payment integration to the checkout service. Include error handling and webhook setup.",
      thinking: "high",
    },
    {
      name: "Analytics Dashboard",
      message:
        "Create a basic analytics dashboard showing user engagement metrics. Use Chart.js for visualizations.",
      thinking: "high",
    },
    {
      name: "Email Notifications",
      message:
        "Set up SendGrid email notification system for user actions. Include templates for welcome, reset password, and order confirmation.",
      thinking: "medium",
    },
    {
      name: "API Documentation",
      message:
        "Generate OpenAPI documentation for all REST endpoints. Include example requests and responses.",
      thinking: "medium",
    },
  ];

  // Execute all tasks in parallel
  const results = await executeParallelOpenClawTasks(baseSnapshotId, tasks);

  // Process results
  console.log("\n📝 Next Steps:");
  console.log("  1. Review the output from each task");
  console.log("  2. Launch devboxes from post-execution snapshots to inspect code");
  console.log("  3. Merge successful implementations into your main codebase");
  console.log("  4. Re-run failed tasks with adjusted prompts if needed\n");

  return results;
}

// ============================================================================
// Advanced Pattern: Task Coordination with Shared Context
// ============================================================================

/**
 * For tasks that need to share context (while still running independently),
 * you can create snapshots between stages:
 *
 * Stage 1: Research Phase
 *   - Task 1: Analyze competitor features
 *   - Task 2: Review user feedback
 *   - Task 3: Check technical constraints
 *   → Snapshot results from all three tasks
 *
 * Stage 2: Implementation Phase (new devboxes from Stage 1 snapshots)
 *   - Task A: Implement based on Task 1 findings
 *   - Task B: Implement based on Task 2 findings
 *   - Task C: Implement based on Task 3 findings
 *
 * Each stage runs in parallel, but sequential stages can build on previous work.
 */

async function multiStageParallelExample() {
  const client = new Runloop({
    bearerToken: process.env.RUNLOOP_API_KEY,
  });

  console.log("\n🔄 Multi-Stage Parallel Execution\n");

  // Stage 1: Parallel research
  const researchTasks: ParallelTask[] = [
    {
      name: "Competitor Analysis",
      message: "Research top 3 competitors and document their key features",
      thinking: "high",
    },
    {
      name: "User Feedback Analysis",
      message: "Analyze user feedback from the past month and identify top 5 requested features",
      thinking: "high",
    },
    {
      name: "Technical Feasibility",
      message:
        "Assess our current architecture and identify technical constraints for new features",
      thinking: "high",
    },
  ];

  const snapshotId = process.env.OPENCLAW_SNAPSHOT_ID;
  if (!snapshotId) {
    throw new Error("OPENCLAW_SNAPSHOT_ID environment variable is required");
  }
  console.log("Stage 1: Research Phase");
  const researchResults = await executeParallelOpenClawTasks(snapshotId, researchTasks);

  // Stage 2: Use research results for implementation
  // In a real scenario, you'd parse the research outputs and generate implementation tasks
  const implementationTasks: ParallelTask[] = researchResults
    .filter((r) => r.success)
    .map((result, i) => ({
      name: `Implement findings from ${result.taskName}`,
      message: `Based on the research completed, implement the top priority feature. Use the context from snapshot ${result.postSnapshot}`,
      thinking: "high" as const,
    }));

  if (implementationTasks.length > 0) {
    console.log("\nStage 2: Implementation Phase");
    await executeParallelOpenClawTasks(snapshotId, implementationTasks);

    console.log("\nMulti-stage execution complete!");
  }
}

// ============================================================================
// Run Examples
// ============================================================================

const __filename = fileURLToPath(import.meta.url);
const isMain = process.argv[1] && resolve(process.argv[1]) === __filename;
if (isMain) {
  const args = process.argv.slice(2);

  if (args.includes("--multi-stage")) {
    multiStageParallelExample().catch(console.error);
  } else {
    parallelFeatureDevelopmentExample().catch(console.error);
  }
}

export { executeParallelOpenClawTasks, type ParallelTask, type ParallelExecutionResult };
