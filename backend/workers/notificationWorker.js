import { JOB_TYPES } from "../services/queue/jobTypes.js";
import emailService from "../services/email/emailService.js";
import logger from "../utils/logger.js";

const handlers = {
    [JOB_TYPES.SEND_WELCOME_EMAIL]: emailService.sendWelcomeEmail,
    [JOB_TYPES.SEND_SUBSCRIPTION_EMAIL]: emailService.sendSubscriptionEmail,
};

export const handler = async (event) => {
    const batchItemFailures = [];

    for (const record of event.Records) {
        try {
            const { type, payload } = JSON.parse(record.body);
            const jobHandler = handlers[type];

            if (!jobHandler) {
                logger.warn({ type, messageId: record.messageId }, "Unknown job type");
                continue;
            }

            await jobHandler(payload);
        } catch (e) {
            logger.error({ err: e, messageId: record.messageId }, "Error processing notification job");
            batchItemFailures.push({ itemIdentifier: record.messageId });
        }
    }

    return { batchItemFailures };
};
