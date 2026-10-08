import express from "express";
import { checkDuplicateEvent, verifyWebhookSignature } from "../../middlewares/webhook.middleware.js";
import { paymentServiceWebhookController } from "./payment.webhook.controller.js";

const router = express.Router();

router.post("/payment", verifyWebhookSignature, checkDuplicateEvent, paymentServiceWebhookController);

export { router as webhookRouter };
