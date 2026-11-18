const { spawn } = require("child_process");

const api = spawn(process.execPath, ["server.js"], {
  stdio: "inherit"
});

const admin = spawn(process.execPath, ["admin-server.js"], {
  stdio: "inherit"
});

let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  if (!api.killed) api.kill("SIGTERM");
  if (!admin.killed) admin.kill("SIGTERM");

  process.exitCode = code;
}

api.on("exit", (code) => shutdown(code ?? 1));
admin.on("exit", (code) => shutdown(code ?? 1));

process.on("SIGTERM", () => shutdown(0));
process.on("SIGINT", () => shutdown(0));
