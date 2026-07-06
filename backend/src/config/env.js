import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX || 100),
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  OPENAI_IMAGE_MODEL: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
};
