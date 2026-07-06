import { z } from "zod";

export const USE_CASES = {
  HOME: "home",
  BUSINESS: "business",
};

export const RESPONSE_TYPES = {
  TEXT: "text",
  IMAGE: "image",
};

export const DEFAULT_MODE = USE_CASES.HOME;

export const ASSISTANT_RESPONSE_SCHEMA = z.object({
  type: z.enum([RESPONSE_TYPES.TEXT, RESPONSE_TYPES.IMAGE]),
  content: z.string(),
  mediaUrl: z.string().nullable(),
  mediaUrls: z.array(z.string()).optional().default([]),
});
