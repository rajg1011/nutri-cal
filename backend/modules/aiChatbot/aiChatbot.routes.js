import express from "express";
import { aiChatbotController, getChatHistoryController } from "./aiChatbot.controller.js";



const router = express.Router();

router.post("/chat", aiChatbotController);
router.get("/history", getChatHistoryController);

export { router as aiChatbotRoutes };