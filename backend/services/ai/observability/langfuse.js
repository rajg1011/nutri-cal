import langfuse from "../../../config/langfuse";

const safeFlush = async () => {
    try {
        await langfuse.flushAsync();
    } catch (e) {
        console.log(e, "Langfuse flush failed");
    }
};


export { safeFlush }