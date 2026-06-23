import langfuse from "../../../config/langfuse.js";

const safeFlush = async () => {
    try {
        await langfuse.flushAsync();
    } catch (e) {
        console.log(e, "Langfuse flush failed");
    }
};


export { safeFlush }