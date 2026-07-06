import test from "node:test";
import assert from "node:assert/strict";
import { ASSISTANT_RESPONSE_SCHEMA } from "../src/types/ai.types.js";

test("assistant response schema accepts text responses", () => {
  const parsed = ASSISTANT_RESPONSE_SCHEMA.parse({
    type: "text",
    content: "A polished business response.",
    mediaUrl: null,
    mediaUrls: [],
  });

  assert.equal(parsed.type, "text");
  assert.equal(parsed.mediaUrl, null);
});

test("assistant response schema accepts image responses", () => {
  const parsed = ASSISTANT_RESPONSE_SCHEMA.parse({
    type: "image",
    content: "",
    mediaUrl: "http://localhost:5000/uploads/generated.png",
    mediaUrls: [
      "http://localhost:5000/uploads/generated.png",
      "http://localhost:5000/uploads/generated-2.png",
      "http://localhost:5000/uploads/generated-3.png",
    ],
  });

  assert.equal(parsed.type, "image");
  assert.match(parsed.mediaUrl, /uploads\/generated\.png$/);
  assert.equal(parsed.mediaUrls.length, 3);
});
