import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Agent, Runner, tool } from "@openai/agents";
import { imageGenerationTool } from "@openai/agents-openai";
import { z } from "zod";
import { imagePrompt } from "../prompts/image.prompt.js";
import { ASSISTANT_RESPONSE_SCHEMA } from "../types/ai.types.js";
import { env } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "../../uploads");

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

const hostedImageAgent = new Agent({
  name: "Hosted Image Variant Agent",
  instructions: (runContext) => `You generate exactly one final artwork image.

Use the hosted image generation tool exactly once.

The current variation target is ${runContext?.context?.variantLabel || "one variant"}.

Respect the supplied prompt fully and do not explain your work.

After generating the image, give only a short confirmation.`,
  tools: [
    imageGenerationTool({
      model: env.OPENAI_IMAGE_MODEL,
      size: "1024x1024",
      quality: "high",
      outputFormat: "png",
    }),
  ],
});

async function ensureUploadsDir() {
  await fs.mkdir(uploadsDir, { recursive: true });
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

function extractImageFromHostedRun(runResult) {
  const hostedItems = runResult?.newItems || [];

  for (let index = hostedItems.length - 1; index >= 0; index -= 1) {
    const rawItem = hostedItems[index]?.rawItem;

    if (rawItem?.type !== "hosted_tool_call") {
      continue;
    }

    if (rawItem?.name !== "image_generation_call") {
      continue;
    }

    const candidates = [rawItem.output, rawItem.providerData?.result];

    for (const candidate of candidates) {
      const extracted = extractBase64Image(candidate);

      if (extracted) {
        return extracted;
      }
    }
  }

  const rawResponses = runResult?.rawResponses || [];

  for (let responseIndex = rawResponses.length - 1; responseIndex >= 0; responseIndex -= 1) {
    const responseOutput = rawResponses[responseIndex]?.response?.output || [];

    for (let itemIndex = responseOutput.length - 1; itemIndex >= 0; itemIndex -= 1) {
      const item = responseOutput[itemIndex];

      if (item?.type !== "image_generation_call") {
        continue;
      }

      const extracted = extractBase64Image(item?.result);

      if (extracted) {
        return extracted;
      }
    }
  }

  throw new Error("Hosted image generation did not return image data.");
}

async function generateVariantImage({ runner, prompt, variant, baseUrl }) {
  const runResult = await runner.run(hostedImageAgent, prompt, {
    context: { variantLabel: variant.label },
  });
  const generatedImage = extractImageFromHostedRun(runResult);
  const filename = await writeGeneratedImage(
    generatedImage.base64,
    generatedImage.extension,
  );

  return buildPublicUrl(baseUrl, filename);
}

const generateImagesTool = tool({
  name: "generate_display_images",
  description:
    "Generate exactly 3 display-ready images from the current image request using the existing base image prompt.",
  parameters: z.object({}),
  strict: true,
  async execute(_input, runContext) {
    if (!env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is required for image generation.");
    }

    const userPrompt = runContext?.context?.userPrompt || "";
    const useCase = runContext?.context?.useCase || "home";
    const mediaUrl = runContext?.context?.mediaUrl || null;
    const runner = new Runner();

    const mediaUrls = [];

    for (const variant of IMAGE_VARIANTS) {
      const requestPrompt = buildImageGenerationPrompt({
        userPrompt,
        useCase,
        mediaUrl,
        variantDirection: variant.direction,
      });
      const mediaUrlForVariant = await generateVariantImage({
        runner,
        prompt: requestPrompt,
        variant,
        baseUrl: runContext?.context?.baseUrl,
      });

      mediaUrls.push(mediaUrlForVariant);
    }

    return JSON.stringify(
      ASSISTANT_RESPONSE_SCHEMA.parse({
        type: "image",
        content: "",
        mediaUrl: mediaUrls[0] || null,
        mediaUrls,
      }),
    );
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
