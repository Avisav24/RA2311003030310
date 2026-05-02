/**
 * 0/1 Knapsack algorithm — selects the subset of tasks that maximises
 * total impact without exceeding the available mechanic-hour budget.
 *
 * Time complexity : O(n * capacity)
 * Space complexity: O(n * capacity)  — can be reduced to O(capacity) if
 *                   backtracking is not required; kept 2-D here so we can
 *                   reconstruct the exact set of selected tasks.
 *
 * @param {{ id: string, duration: number, impact: number }[]} tasks
 * @param {number} capacity  Maximum mechanic-hours available (budget).
 * @returns {{ selected: typeof tasks, totalDuration: number, totalImpact: number }}
 */
export function solveKnapsack(tasks, capacity) {
  const n = tasks.length;

  // Build DP table: dp[i][w] = best impact using first i tasks within w hours
  const dp = Array.from({ length: n + 1 }, () => new Array(capacity + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    const task = tasks[i - 1];
    for (let w = 0; w <= capacity; w++) {
      const skip = dp[i - 1][w];
      const take =
        task.duration <= w
          ? dp[i - 1][w - task.duration] + task.impact
          : -Infinity;
      dp[i][w] = Math.max(skip, take);
    }
  }

  // Backtrack to find the selected tasks
  const selected = [];
  let remaining = capacity;

  for (let i = n; i >= 1; i--) {
    if (dp[i][remaining] !== dp[i - 1][remaining]) {
      const task = tasks[i - 1];
      selected.push(task);
      remaining -= task.duration;
    }
  }

  selected.reverse();

  return {
    selected,
    totalDuration: selected.reduce((sum, t) => sum + t.duration, 0),
    totalImpact: selected.reduce((sum, t) => sum + t.impact, 0),
  };
}
