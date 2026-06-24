import { JOB_TYPES } from "../services/queue/jobTypes.js";
import emailService from "../services/email/emailService.js";

const handlers = {
    [JOB_TYPES.SEND_WELCOME_EMAIL]: emailService.sendWelcomeEmail,
};

export const handler = async (event) => {
    const batchItemFailures = [];

    for (const record of event.Records) {
        try {
            const { type, payload } = JSON.parse(record.body);
            const jobHandler = handlers[type];

            if (!jobHandler) {
                console.log(`Unknown job type: ${type}`);
                continue;
            }

            await jobHandler(payload);
        } catch (e) {
            console.log(e);
            batchItemFailures.push({ itemIdentifier: record.messageId });
        }
    }

    return { batchItemFailures };
};
