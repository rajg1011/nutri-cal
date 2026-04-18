import express from "express";
import { aiChatbotController } from "./aiChatbot.controller.js";



const router = express.Router();

router.post("/chat", aiChatbotController);

export { router as aiChatbotRoutes };