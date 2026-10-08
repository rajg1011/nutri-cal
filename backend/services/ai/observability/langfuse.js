import langfuse from "../../../config/langfuse.js";
import logger from "../../../utils/logger.js";

const safeFlush = async () => {
    try {
        await langfuse.flushAsync();
    } catch (e) {
        logger.warn({ err: e }, "Langfuse flush failed");
    }
};


export { safeFlush }