import express from "express";
import { createOrderController, verifyPaymentController } from "./payment.controller.js";

const router = express.Router();

router.post("/order", createOrderController);
router.post("/verify", verifyPaymentController);

export { router as paymentRoutes };