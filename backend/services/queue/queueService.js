import sqsProvider from "./provider/sqs.js";

const providers = {
    sqs: sqsProvider,
};

const enqueue = async (jobType, payload) => {
    const providerKey = (process.env.QUEUE_PROVIDER?.toLowerCase() || "sqs");
    const provider = providers[providerKey];

    if (!provider) {
        throw new Error("Invalid queue provider");
    }

    return provider.enqueue(jobType, payload);
};

export default { enqueue };
