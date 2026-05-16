import express from "express";
import { createOrderController, createPlanController, verifyPaymentController, checkSubscriptionController } from "./payment.controller.js";

const router = express.Router();

router.post("/order", createOrderController);
router.post("/plan", createPlanController)
router.post("/verify", verifyPaymentController);
router.get("/check-subscription", checkSubscriptionController);

export { router as paymentRoutes };