export async function withRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number,
    baseDelayMs: number
): Promise<T> {
    let attempt = 1;

    while (true) {
        try {
            return await operation();
        } catch (error: any) {
            if (attempt >= maxAttempts) {
                throw error;
            }

            // Exponential backoff
            const delay = baseDelayMs * Math.pow(2, attempt - 1);
            console.warn(`[Retry] Operation failed. Retrying attempt ${attempt + 1}/${maxAttempts} in ${delay}ms...`, error.message);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            attempt++;
        }
    }
}
