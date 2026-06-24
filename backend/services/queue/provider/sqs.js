import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const client = new SQSClient({ region: process.env.AWS_REGION || "ap-south-1" });

const enqueue = async (jobType, payload) => {
    const command = new SendMessageCommand({
        QueueUrl: process.env.NOTIFICATIONS_QUEUE_URL,
        MessageBody: JSON.stringify({ type: jobType, payload }),
    });
    return client.send(command);
};

export default { enqueue };
