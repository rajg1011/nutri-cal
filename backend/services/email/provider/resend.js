import { Resend } from "resend";
import { buildWelcomeEmailHtml, buildWelcomeEmailText } from "../../../utils/emailTemplates/welcome.js";

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

export default { sendWelcomeEmail };
