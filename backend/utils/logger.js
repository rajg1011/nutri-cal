import pino from "pino";

const logger = pino({
    level: process.env.LOG_LEVEL || "info",
    base: undefined,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
        level: (label) => ({ level: label }),
    },
    serializers: {
        err: pino.stdSerializers.err,
    },
});

export default logger;
