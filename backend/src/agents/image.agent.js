import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Agent, tool } from "@openai/agents";
import { z } from "zod";
import { imagePrompt } from "../prompts/image.prompt.js";
import { ASSISTANT_RESPONSE_SCHEMA } from "../types/ai.types.js";
import { env } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "../../uploads");
const IMAGE_VARIANT_TIMEOUT_MS = 120000;
const IMAGE_WORKFLOW_TIMEOUT_MS = 420000;

const IMAGE_VARIANTS = [
  {
    label: "variant-1",
    direction:
      "Create a minimal, spacious interpretation with restrained complexity, clean visual hierarchy, and calm negative space.",
  },
  {
    label: "variant-2",
    direction:
      "Create a bold, dramatic interpretation with stronger contrast, more assertive composition, and a striking visual presence.",
  },
  {
    label: "variant-3",
    direction:
      "Create a textural, atmospheric interpretation with richer surfaces, experimental details, and a more expressive artistic feel.",
  },
];

async function ensureUploadsDir() {
  await fs.mkdir(uploadsDir, { recursive: true });
}

function withTimeout(operation, timeoutMs, timeoutMessage) {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  return Promise.race([operation, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

function markAsImageGenerationError(error, metadata = {}) {
  error.isImageGenerationError = true;
  error.imageGenerationMetadata = metadata;
  return error;
}

async function writeGeneratedImage(base64Payload, extension = "png") {
  await ensureUploadsDir();

  const safeExtension = (extension || "png").replace(/[^a-z0-9]/gi, "") || "png";
  const filename = `generated-${Date.now()}-${Math.round(Math.random() * 1e9)}.${safeExtension}`;
  const absolutePath = path.join(uploadsDir, filename);

  await fs.writeFile(absolutePath, Buffer.from(base64Payload, "base64"));

  return filename;
}

function buildPublicUrl(baseUrl, filename) {
  const sanitizedBaseUrl = (baseUrl || "").replace(/\/$/, "");
  return `${sanitizedBaseUrl}/uploads/${filename}`;
}

function buildImageGenerationPrompt({ userPrompt, useCase, mediaUrl, variantDirection }) {
  const sections = [
    imagePrompt,
    `Use case: ${useCase || "home"}`,
    `User request: ${userPrompt || ""}`,
    `Variation directive: ${variantDirection}`,
  ];

  if (mediaUrl) {
    sections.push(`Reference image URL: ${mediaUrl}`);
  }

  return sections.join("\n\n");
}

function extractBase64Image(source) {
  if (typeof source !== "string" || source.length === 0) {
    return null;
  }

  const dataUrlMatch = source.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (dataUrlMatch) {
    const mediaType = dataUrlMatch[1];
    const extension = mediaType.split("/")[1] || "png";

    return {
      base64: dataUrlMatch[2],
      extension,
    };
  }

  return {
    base64: source,
    extension: "png",
  };
}

async function generateVariantImage({ prompt, variant, baseUrl }) {
  const timerLabel = `[Image Variant] ${variant.label}`;

  console.time(timerLabel);
  console.info("[Image Variant] Starting", {
    variant: variant.label,
  });

  try {
    console.info("[Image Variant] Calling OpenAI Images API", {
      variant: variant.label,
      model: env.OPENAI_IMAGE_MODEL,
    });

    const response = await withTimeout(
      fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: env.OPENAI_IMAGE_MODEL,
          prompt,
          size: "1024x1024",
          quality: "high",
          output_format: "png",
        }),
      }),
      IMAGE_VARIANT_TIMEOUT_MS,
      `Image generation timeout for ${variant.label}`,
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenAI Images API failed for ${variant.label}: ${response.status} ${errorText}`,
      );
    }

    console.info("[Image Variant] Waiting for image response body", {
      variant: variant.label,
    });
    const payload = await response.json();
    const imageBase64 =
      payload?.data?.find((item) => typeof item?.b64_json === "string")?.b64_json ||
      null;

    if (!imageBase64) {
      throw new Error(
        `OpenAI Images API did not return image data for ${variant.label}.`,
      );
    }

    console.info("[Image Variant] Image received", {
      variant: variant.label,
    });

    console.info("[Image Variant] Writing generated image to uploads", {
      variant: variant.label,
      extension: "png",
    });
    const filename = await writeGeneratedImage(imageBase64, "png");
    const publicUrl = buildPublicUrl(baseUrl, filename);

    console.info("[Image Variant] Completed", {
      variant: variant.label,
      publicUrl,
    });

    return publicUrl;
  } catch (error) {
    console.error("[Image Variant] Failed", {
      variant: variant.label,
      message: error?.message,
      stack: error?.stack,
    });
    throw markAsImageGenerationError(error, {
      variant: variant.label,
    });
  } finally {
    console.timeEnd(timerLabel);
  }
}

const generateImagesTool = tool({
  name: "generate_display_images",
  description:
    "Generate exactly 3 display-ready images from the current image request using the existing base image prompt.",
  parameters: z.object({}),
  strict: true,
  async execute(_input, runContext) {
    console.time("Image Workflow");
    console.info("[Image Workflow] Starting image workflow", {
      useCase: runContext?.context?.useCase || "home",
      hasMediaUrl: Boolean(runContext?.context?.mediaUrl),
    });

    if (!env.OPENAI_API_KEY) {
      throw markAsImageGenerationError(
        new Error("OPENAI_API_KEY is required for image generation."),
      );
    }

    try {
      const userPrompt = runContext?.context?.userPrompt || "";
      const useCase = runContext?.context?.useCase || "home";
      const mediaUrl = runContext?.context?.mediaUrl || null;

      const mediaUrls = await withTimeout(
        (async () => {
          const urls = [];

          for (const variant of IMAGE_VARIANTS) {
            console.info("[Image Workflow] Preparing variant prompt", {
              variant: variant.label,
            });
            const requestPrompt = buildImageGenerationPrompt({
              userPrompt,
              useCase,
              mediaUrl,
              variantDirection: variant.direction,
            });

            const mediaUrlForVariant = await generateVariantImage({
              prompt: requestPrompt,
              variant,
              baseUrl: runContext?.context?.baseUrl,
            });

            urls.push(mediaUrlForVariant);
          }

          return urls;
        })(),
        IMAGE_WORKFLOW_TIMEOUT_MS,
        "Image generation workflow timeout",
      );

      console.info("[Image Workflow] Image workflow completed", {
        imageCount: mediaUrls.length,
      });

      return JSON.stringify(
        ASSISTANT_RESPONSE_SCHEMA.parse({
          type: "image",
          content: "",
          mediaUrl: mediaUrls[0] || null,
          mediaUrls,
        }),
      );
    } catch (error) {
      console.error("[Image Workflow] Failed", {
        message: error?.message,
        stack: error?.stack,
      });
      throw markAsImageGenerationError(error);
    } finally {
      console.timeEnd("Image Workflow");
    }
  },
});

export const imageAgent = new Agent({
  name: "Image Agent",
  instructions: (runContext) => {
    const mediaUrl = runContext?.context?.mediaUrl;

    return `You are the Vizzy Image Agent.

Your only job is to generate images for image requests.

Do not rewrite, optimize, or expand the user's prompt yourself.

Use the existing base image prompt already configured in the backend.

${mediaUrl ? `A reference image URL is available: ${mediaUrl}` : ""}

You must call the generate_display_images tool exactly once.

Do not answer directly with text.`;
  },
  handoffDescription:
    "Handles artwork and image-generation requests by generating images directly.",
  tools: [generateImagesTool],
  toolUseBehavior: "stop_on_first_tool",
  outputType: ASSISTANT_RESPONSE_SCHEMA,
});
