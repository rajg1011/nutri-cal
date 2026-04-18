import "dotenv/config";
import express from "express";
import cors from "cors";
import { aiChatbotRoutes } from "./modules/aiChatbot/aiChatbot.routes.js";
import AuthMiddleWare from "./middlewares/auth.middleware.js";
import { paymentRoutes } from "./modules/payment/payment.routes.js";


const app = express();
app.use(express.json());
app.use(cors());
app.use(AuthMiddleWare)

app.use("/api/chatbot", aiChatbotRoutes);
app.use("/payment", paymentRoutes)

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//     console.log(`NutriCal Backend is running on port ${PORT}`);
// });

export default app;
