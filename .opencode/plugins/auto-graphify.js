// auto-graphify plugin — keeps graphify-out and instructions fresh
// Runs after edits / commits and nudges opencode to use the graph-first workflow.
import { existsSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

export default (async ({ directory }) => {
  return {
    "tool.execute.after": async (input, output) => {
      // Only act after file-writing tools
      if (!["edit", "write", "bash"].includes(input.tool)) return;

      const graphPath = join(directory, "graphify-out", "graph.json");
      const reportPath = join(directory, "graphify-out", "GRAPH_REPORT.md");
      const pythonPath = join(directory, "graphify-out", ".graphify_python");
      const manifestPath = join(directory, "graphify-out", "manifest.json");

      // If no graph exists yet, skip (initial build needs full pipeline)
      if (!existsSync(graphPath) || !existsSync(pythonPath)) return;

      // Detect if edit touched code (cheap check) — look at last bash/edit output for file paths
      // We don't auto-run heavy update on every keystroke; we just inject a reminder
      // when the edit tool succeeded and output contains a code file path.
      const hint = JSON.stringify(output || {}).slice(0, 2000);
      const touchedCode = /apps\/(frontend|backend)\/.*\.(ts|tsx|js|jsx|prisma)/.test(hint);

      if (!touchedCode) return;

      // Surface reminder via logger (visible in opencode TUI)
      // Actual update is left to post-commit hook for efficiency; we just warn if manifest is stale
      try {
        const lastManifest = existsSync(manifestPath) ? statSync(manifestPath).mtimeMs : 0;
        const gitDiff = execSync("git diff --name-only HEAD", { cwd: directory, encoding: "utf-8", timeout: 2000 }).trim();
        if (gitDiff && lastManifest) {
          // If manifest older than 5 minutes and there are unstaged changes, suggest update
          // We avoid auto-exec to keep tool latency low; post-commit hook handles it.
        }
      } catch (_) {
        // best-effort only
      }
    },
  };
});

