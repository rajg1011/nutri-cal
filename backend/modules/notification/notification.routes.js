import express from "express";
import { welcomeEmailController } from "./notification.controller.js";

const router = express.Router();

router.post("/welcome-email", welcomeEmailController);

export { router as notificationRoutes };
