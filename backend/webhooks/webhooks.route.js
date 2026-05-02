import express from "express";
import paymentServiceWebhook from "../paymentGateway/paymentService.webhook";

const router = express.Router();

router.post("/payment", paymentServiceWebhook.webhookHandler);

export { router as webhookRouter };