import { spawn } from "child_process";
import path from "path";

export function runCreWorkflow(proof:any): Promise<number> {
    return new Promise((resolve, reject) => {
      const workflowDir = path.resolve(__dirname, "../cre-workflow");
  
      const proc = spawn("cre", [
        "workflow",
        "simulate",
        "identity",
        "--non-interactive",
        "--trigger-index", "0",
        "--http-payload", "test-payload.json",
        "--target", "staging-settings"
      ], {
        cwd: workflowDir,
        shell: true,
        stdio: "inherit"
      });
  
      proc.on("close", (code) => {
        if (code === 0) resolve(code!);
        else reject(new Error(`CRE exited with code ${code}`));
      });
  
      proc.on("error", reject);
    });
  }