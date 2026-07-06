import express from "express";
import {
  handleChat,
  handleGetConversation,
  handleGetConversations,
  handleDeleteConversation,
} from "../controllers/ai.controller.js";
import { handleUploadImage } from "../controllers/upload.controller.js";

const router = express.Router();

router.post("/chat", handleChat);
router.post("/upload", handleUploadImage);
router.get("/conversations", handleGetConversations);
router.get("/conversations/:id", handleGetConversation);
router.delete("/conversations/:id", handleDeleteConversation);

export default router;
