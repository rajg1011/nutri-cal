import express from "express";
import { createOrderController, createPlanController, verifyPaymentController } from "./payment.controller.js";

const router = express.Router();

router.post("/order", createOrderController);
router.post("/plan", createPlanController)
router.post("/verify", verifyPaymentController);

export { router as paymentRoutes };