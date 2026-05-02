import express from "express";
import paymentServiceWebhook from "../paymentGateway/paymentService.webhook.js";

const router = express.Router();

router.post("/payment", paymentServiceWebhook.webhookHandler);

export { router as webhookRouter };