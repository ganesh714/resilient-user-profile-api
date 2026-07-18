import { CircuitBreaker, CircuitState, CircuitBreakerOpenException } from '../../src/resilience/CircuitBreaker';

describe('CircuitBreaker', () => {
    let cb: CircuitBreaker;
    const FAILURE_THRESHOLD = 3;
    const RESET_TIMEOUT_MS = 100; // Small for testing
    const HALF_OPEN_SUCCESS = 2;

    beforeEach(() => {
        cb = new CircuitBreaker(FAILURE_THRESHOLD, RESET_TIMEOUT_MS, HALF_OPEN_SUCCESS);
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const successOp = async () => 'success';
    const failOp = async () => { throw new Error('fail'); };

    it('should stay CLOSED on successful calls', async () => {
        const result = await cb.execute(successOp);
        expect(result).toBe('success');
        expect(cb.getState()).toBe(CircuitState.CLOSED);
    });

    it('should transition to OPEN after reaching failure threshold', async () => {
        // 1st failure
        await expect(cb.execute(failOp)).rejects.toThrow('fail');
        expect(cb.getState()).toBe(CircuitState.CLOSED);

        // 2nd failure
        await expect(cb.execute(failOp)).rejects.toThrow('fail');
        expect(cb.getState()).toBe(CircuitState.CLOSED);

        // 3rd failure - trips breaker
        await expect(cb.execute(failOp)).rejects.toThrow('fail');
        expect(cb.getState()).toBe(CircuitState.OPEN);
    });

    it('should reject requests immediately when OPEN', async () => {
        for (let i = 0; i < FAILURE_THRESHOLD; i++) {
            await expect(cb.execute(failOp)).rejects.toThrow('fail');
        }
        
        // Circuit is now OPEN
        expect(cb.getState()).toBe(CircuitState.OPEN);

        // Next call should fail fast with CircuitBreakerOpenException
        await expect(cb.execute(successOp)).rejects.toThrow(CircuitBreakerOpenException);
    });

    it('should transition to HALF_OPEN after timeout and then to CLOSED on success', async () => {
        for (let i = 0; i < FAILURE_THRESHOLD; i++) {
            await expect(cb.execute(failOp)).rejects.toThrow();
        }
        
        expect(cb.getState()).toBe(CircuitState.OPEN);

        // Advance time past the reset timeout
        jest.advanceTimersByTime(RESET_TIMEOUT_MS + 10);

        // First call in HALF_OPEN (success 1)
        await cb.execute(successOp);
        expect(cb.getState()).toBe(CircuitState.HALF_OPEN);

        // Second call in HALF_OPEN (success 2) -> should trip to CLOSED
        await cb.execute(successOp);
        expect(cb.getState()).toBe(CircuitState.CLOSED);
    });

    it('should transition back to OPEN if a call fails while HALF_OPEN', async () => {
        for (let i = 0; i < FAILURE_THRESHOLD; i++) {
            await expect(cb.execute(failOp)).rejects.toThrow();
        }
        
        jest.advanceTimersByTime(RESET_TIMEOUT_MS + 10);

        // First call in HALF_OPEN (fails)
        await expect(cb.execute(failOp)).rejects.toThrow('fail');
        expect(cb.getState()).toBe(CircuitState.OPEN);
    });
});
