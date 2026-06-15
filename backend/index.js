import "dotenv/config";
import express from "express";
import cors from "cors";
import { aiChatbotRoutes } from "./modules/aiChatbot/aiChatbot.routes.js";
import AuthMiddleWare from "./middlewares/auth.middleware.js";
import { paymentRoutes } from "./modules/payment/payment.routes.js";
import { webhookRouter } from "./webhooks/payment/payment.webhook.route.js";
import { AISubscriberMiddleware } from "./middlewares/aiSubscriber.middleware.js";


const app = express();
app.use(cors({
    origin: 'https://nutri-cal.pages.dev',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));

app.use("/api/chatbot", express.json(), AuthMiddleWare, AISubscriberMiddleware, aiChatbotRoutes);
app.use("/payment", express.json(), AuthMiddleWare, paymentRoutes)
app.use("/webhook", express.raw({ type: '*/*' }), webhookRouter)

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//     console.log(`NutriCal Backend is running on port ${PORT}`);
// });

export default app;
