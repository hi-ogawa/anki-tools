import { spawn } from "node:child_process";

const [cmd, ...args] = process.argv.slice(2);
const child = spawn(cmd, args, { stdio: "inherit" });

// Forward signals to child for graceful shutdown
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => child.kill(signal));
}
