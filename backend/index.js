import "dotenv/config";
import express from "express";
import cors from "cors";
import { aiChatbotRoutes } from "./modules/aiChatbot/aiChatbot.routes.js";
import AuthMiddleWare from "./middlewares/auth.middleware.js";
import { paymentRoutes } from "./modules/payment/payment.routes.js";
import { webhookRouter } from "./webhooks/payment/payment.webhook.route.js";


const app = express();
app.use(express.json());
app.use(cors());

app.use("/api/chatbot", AuthMiddleWare, aiChatbotRoutes);
app.use("/payment", AuthMiddleWare, paymentRoutes)
app.use("/webhook", express.raw({ type: '*/*' }), webhookRouter)

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//     console.log(`NutriCal Backend is running on port ${PORT}`);
// });

export default app;
