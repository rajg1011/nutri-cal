import { Resend } from "resend";
import { buildWelcomeEmailHtml, buildWelcomeEmailText } from "../../../utils/emailTemplates/welcome.js";
import { buildSubscriptionEmailHtml, buildSubscriptionEmailText } from "../../../utils/emailTemplates/subscription.js";
import { SUBSCRIPTION_TYPE_PRO } from "../../../constant.js";

const client = new Resend(process.env.RESEND_API_KEY);


const sendWelcomeEmail = async ({ email, name }) => {
    const { error } = await client.emails.send({
        from: process.env.RESEND_SENDER_EMAIL,
        to: [email],
        subject: "Welcome to NutriCal!",
        html: buildWelcomeEmailHtml(name),
        text: buildWelcomeEmailText(name),
    });

    if (error) {
        throw new Error(error.message || "Failed to send email via Resend");
    }
};

const sendSubscriptionEmail = async (payload) => {
    const subject = payload.plan === SUBSCRIPTION_TYPE_PRO
        ? "You're now on NutriCal AI Pro!"
        : "Your NutriCal AI questions are live!";

    const { error } = await client.emails.send({
        from: process.env.RESEND_SENDER_EMAIL,
        to: [payload.email],
        subject,
        html: buildSubscriptionEmailHtml(payload),
        text: buildSubscriptionEmailText(payload),
    });

    if (error) {
        throw new Error(error.message || "Failed to send email via Resend");
    }
};

export default { sendWelcomeEmail, sendSubscriptionEmail };
