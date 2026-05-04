import express from "express";
import { checkDuplicateEvent } from "../../middlewares/webhook.middleware.js";
import { paymentServiceWebhookController } from "./payment.webhook.controller.js";

const router = express.Router();

router.post("/payment", checkDuplicateEvent, paymentServiceWebhookController);

export { router as webhookRouter };