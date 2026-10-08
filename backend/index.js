import "dotenv/config";
import express from "express";
import cors from "cors";
import { aiChatbotRoutes } from "./modules/aiChatbot/aiChatbot.routes.js";
import AuthMiddleWare from "./middlewares/auth.middleware.js";
import { paymentRoutes } from "./modules/payment/payment.routes.js";
import { webhookRouter } from "./webhooks/payment/payment.webhook.route.js";
import { AISubscriberMiddleware } from "./middlewares/aiSubscriber.middleware.js";
import { notificationRoutes } from "./modules/notification/notification.routes.js";
import logger from "./utils/logger.js";


const app = express();
app.use(cors({
    origin: 'https://nutri-cal.pages.dev',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));

app.use("/api/chatbot", express.json(), AuthMiddleWare, AISubscriberMiddleware, aiChatbotRoutes);
app.use("/payment", express.json(), AuthMiddleWare, paymentRoutes)
app.use("/api/notifications", express.json(), AuthMiddleWare, notificationRoutes)
app.use("/webhook", express.raw({ type: '*/*' }), webhookRouter)

app.use((err, req, res, next) => {
    logger.error({ err, method: req.method, path: req.path, userId: req.user }, "Unhandled request error");
    if (res.headersSent) {
        return next(err);
    }
    return res.status(err.status || 500).json({ success: false, message: "Internal Server Error" });
});

process.on("unhandledRejection", (reason) => {
    logger.error({ err: reason }, "Unhandled promise rejection");
});

process.on("uncaughtException", (err) => {
    logger.fatal({ err }, "Uncaught exception");
    process.exit(1);
});

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//     logger.info({ port: PORT }, "NutriCal Backend is running");
// });

export default app;
