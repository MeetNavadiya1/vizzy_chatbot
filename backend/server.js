import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import app from "./src/app.js";
import { env } from "./src/config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "uploads");
const PORT = env.PORT;

async function clearUploadsDirectory() {
  await fs.mkdir(uploadsDir, { recursive: true });

  const entries = await fs.readdir(uploadsDir, { withFileTypes: true });

  await Promise.all(
    entries.map((entry) =>
      fs.rm(path.join(uploadsDir, entry.name), {
        recursive: true,
        force: true,
      }),
    ),
  );

  console.info("Uploads directory cleared on startup.");
}

await clearUploadsDirectory();

const server = app.listen(PORT, () => {
  console.info(`Server is running in ${env.NODE_ENV} mode on port ${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! 💥 Shutting down...", {
    name: err?.name,
    message: err?.message,
    stack: err?.stack,
  });

  server.close(() => {
    process.exit(1);
  });
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...", {
    name: err?.name,
    message: err?.message,
    stack: err?.stack,
  });

  process.exit(1);
});

const gracefulShutdown = (signal) => {
  console.info(`${signal} received. Starting graceful shutdown...`);

  server.close(() => {
    console.info("HTTP server closed.");
    console.info("Process terminated.");
    process.exit(0);
  });

  setTimeout(() => {
    console.error(
      "Could not close connections in time, forcefully shutting down",
    );
    process.exit(1);
  }, 10000).unref();
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
