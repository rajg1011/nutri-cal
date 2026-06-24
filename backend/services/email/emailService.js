import resendProvider from "./provider/resend.js";

const providers = {
    resend: resendProvider,
};

const getProvider = () => {
    const providerKey = (process.env.EMAIL_PROVIDER?.toLowerCase() || "resend");
    const provider = providers[providerKey];

    if (!provider) {
        throw new Error("Invalid email provider");
    }

    return provider;
};

const sendWelcomeEmail = (payload) => getProvider().sendWelcomeEmail(payload);
const sendSubscriptionEmail = (payload) => getProvider().sendSubscriptionEmail(payload);

export default { sendWelcomeEmail, sendSubscriptionEmail };
