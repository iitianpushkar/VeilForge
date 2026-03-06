import { spawn } from "child_process";
import path from "path";

export function IdWorkflow(payload: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const workflowDir = path.resolve(__dirname, "../cre-workflow");

    const proc = spawn(
      "cre",
      [
        "workflow",
        "simulate",
        "identity",
        "--non-interactive",
        "--trigger-index", "0",
        "--http-payload", JSON.stringify(payload),
        "--target", "staging-settings"
      ],
      {
        cwd: workflowDir,
        shell: false,
        stdio: ["ignore", "pipe", "pipe"]
      }
    );

    let output = "";
    let errorOutput = "";

    // 🔥 Mirror stdout live
    proc.stdout.on("data", (data) => {
      const text = data.toString();
      process.stdout.write(text);  // 👈 show live
      output += text;              // 👈 capture
    });

    // 🔥 Mirror stderr live
    proc.stderr.on("data", (data) => {
      const text = data.toString();
      process.stderr.write(text);  // 👈 show errors live
      errorOutput += text;
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(errorOutput));
      }

      try {
        const match = output.match(/Workflow Simulation Result:\s*([\s\S]*?)\n\n/);

        if (!match) {
          return reject(new Error("Could not parse CRE result"));
        }

        const resultJson = JSON.parse(match[1]!);
        resolve(resultJson);
      } catch (err) {
        reject(err);
      }
    });

    proc.on("error", reject);
  });
}

export function optimizerWorkflow(payload: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const workflowDir = path.resolve(__dirname, "../cre-workflow");

    const proc = spawn(
      "cre",
      [
        "workflow",
        "simulate",
        "optimizer",
        "--non-interactive",
        "--trigger-index", "0",
        "--http-payload", JSON.stringify(payload),
        "--target", "staging-settings"
      ],
      {
        cwd: workflowDir,
        shell: false,
        stdio: ["ignore", "pipe", "pipe"]
      }
    );

    let output = "";
    let errorOutput = "";

    // 🔥 Mirror stdout live
    proc.stdout.on("data", (data) => {
      const text = data.toString();
      process.stdout.write(text);  // 👈 show live
      output += text;              // 👈 capture
    });

    // 🔥 Mirror stderr live
    proc.stderr.on("data", (data) => {
      const text = data.toString();
      process.stderr.write(text);  // 👈 show errors live
      errorOutput += text;
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(errorOutput));
      }

      try {
        const match = output.match(/Workflow Simulation Result:\s*([\s\S]*?)\n\n/);

        if (!match) {
          return reject(new Error("Could not parse CRE result"));
        }

        const resultJson = JSON.parse(match[1]!);
        resolve(resultJson);
      } catch (err) {
        reject(err);
      }
    });

    proc.on("error", reject);
  });
}