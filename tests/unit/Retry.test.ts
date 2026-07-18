import { withRetry } from '../../src/resilience/Retry';

describe('Exponential Backoff Retry', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should return result if operation succeeds on first attempt', async () => {
        const operation = jest.fn().mockResolvedValue('success');
        const result = await withRetry(operation, 3, 100);
        expect(result).toBe('success');
        expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry and succeed on subsequent attempts', async () => {
        const operation = jest.fn()
            .mockRejectedValueOnce(new Error('fail 1'))
            .mockResolvedValueOnce('success');
            
        const promise = withRetry(operation, 3, 100);
        
        // Wait for the next tick to allow the first rejection to process
        await Promise.resolve();
        
        // Advance timer by base delay (100ms)
        jest.advanceTimersByTime(100);
        
        const result = await promise;
        expect(result).toBe('success');
        expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should throw error if max attempts are reached', async () => {
        const operation = jest.fn().mockRejectedValue(new Error('always fails'));
        
        const promise = withRetry(operation, 3, 100);
        
        // attempt 1 fails, waits 100ms
        await Promise.resolve();
        jest.advanceTimersByTime(100);
        
        // attempt 2 fails, waits 200ms
        await Promise.resolve();
        jest.advanceTimersByTime(200);

        // attempt 3 fails, throws
        await expect(promise).rejects.toThrow('always fails');
        expect(operation).toHaveBeenCalledTimes(3);
    });
});
