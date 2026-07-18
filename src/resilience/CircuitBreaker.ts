export enum CircuitState {
    CLOSED,
    OPEN,
    HALF_OPEN
}

export class CircuitBreakerOpenException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CircuitBreakerOpenException';
    }
}

export class CircuitBreaker {
    private state: CircuitState = CircuitState.CLOSED;
    private failureCount: number = 0;
    private successCount: number = 0;
    private timeOpened: number | null = null;

    constructor(
        private failureThreshold: number,
        private resetTimeoutMs: number,
        private halfOpenSuccessThreshold: number
    ) {}

    async execute<T>(operation: () => Promise<T>): Promise<T> {
        if (this.state === CircuitState.OPEN) {
            const now = Date.now();
            if (this.timeOpened && now - this.timeOpened > this.resetTimeoutMs) {
                // Time to try half-open
                this.state = CircuitState.HALF_OPEN;
                console.log(`[Circuit Breaker] Transitioned to HALF_OPEN`);
            } else {
                throw new CircuitBreakerOpenException('Circuit breaker is OPEN');
            }
        }

        try {
            const result = await operation();
            this.onSuccess();
            return result;
        } catch (error: any) {
            this.onFailure();
            throw error;
        }
    }

    private onSuccess() {
        if (this.state === CircuitState.HALF_OPEN) {
            this.successCount++;
            if (this.successCount >= this.halfOpenSuccessThreshold) {
                this.state = CircuitState.CLOSED;
                this.failureCount = 0;
                this.successCount = 0;
                this.timeOpened = null;
                console.log(`[Circuit Breaker] Transitioned to CLOSED`);
            }
        } else if (this.state === CircuitState.CLOSED) {
            this.failureCount = 0;
        }
    }

    private onFailure() {
        if (this.state === CircuitState.CLOSED) {
            this.failureCount++;
            if (this.failureCount >= this.failureThreshold) {
                this.tripToOpen();
            }
        } else if (this.state === CircuitState.HALF_OPEN) {
            this.tripToOpen();
        }
    }

    private tripToOpen() {
        this.state = CircuitState.OPEN;
        this.timeOpened = Date.now();
        this.successCount = 0;
        console.warn(`[Circuit Breaker] Transitioned to OPEN`);
    }

    public getState(): CircuitState {
        return this.state;
    }
}
