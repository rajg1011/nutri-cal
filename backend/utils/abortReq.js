import logger from "./logger.js";

const withTimeout = async (operation, ms, label = "Operation") => {
    const controller = new AbortController();
    
    controller.signal.addEventListener("abort", () => {
        logger.warn({ label, timeoutMs: ms }, "Operation aborted");
    });

    let timeoutId;
    try {
        return await Promise.race([
            operation(controller.signal),
            new Promise((_, reject) => {
                timeoutId = setTimeout(() => {
                    controller.abort();
                    reject(new Error(`Timeout: ${label} exceeded ${ms}ms`));
                }, ms);
            }),
        ]);
    } catch (e) {
        throw e;
    } finally {
        clearTimeout(timeoutId);
    }
};
export { withTimeout }