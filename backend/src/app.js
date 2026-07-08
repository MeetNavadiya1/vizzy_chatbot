import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import aiRoutes from "./routes/ai.routes.js";
import { env } from "./config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const isProduction = env.NODE_ENV === "production";

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
    contentSecurityPolicy: isProduction
      ? undefined
      : {
          directives: {
            upgradeInsecureRequests: null,
          },
        },
  }),
);
app.use(compression());
app.use(hpp());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api", aiRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, message: "Backend is healthy" });
});

app.use(express.static(path.join(__dirname, "../../frontend/dist")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
});

export default app;
