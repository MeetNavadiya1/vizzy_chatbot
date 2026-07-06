import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const backendRoot = process.cwd();
const scanRoots = ["server.js", "src", "tests"];

async function collectJsFiles(targetPath) {
  const absolutePath = path.join(backendRoot, targetPath);
  const stats = await fs.stat(absolutePath);

  if (stats.isFile()) {
    return absolutePath.endsWith(".js") ? [absolutePath] : [];
  }

  const entries = await fs.readdir(absolutePath, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(targetPath, entry.name);

      if (entry.isDirectory()) {
        return collectJsFiles(entryPath);
      }

      return entry.name.endsWith(".js")
        ? [path.join(backendRoot, entryPath)]
        : [];
    }),
  );

  return nestedFiles.flat();
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: backendRoot,
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}.`));
    });

    child.on("error", reject);
  });
}

async function main() {
  const files = (
    await Promise.all(scanRoots.map((targetPath) => collectJsFiles(targetPath)))
  )
    .flat()
    .sort();

  for (const file of files) {
    await runCommand(process.execPath, ["--check", file]);
  }

  await runCommand(process.execPath, ["--test", "tests/*.test.js"]);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
