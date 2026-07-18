import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { IUnitOfWork } from '../repositories/interfaces/IUnitOfWork';
import { User } from '../models/User';
import { CircuitBreaker, CircuitBreakerOpenException } from '../resilience/CircuitBreaker';
import { withRetry } from '../resilience/Retry';

export class UserService {
    private circuitBreaker: CircuitBreaker;

    constructor(private uow: IUnitOfWork) {
        this.circuitBreaker = new CircuitBreaker(
            parseInt(process.env.CB_FAILURE_THRESHOLD || '5', 10),
            parseInt(process.env.CB_RESET_TIMEOUT_MS || '30000', 10),
            parseInt(process.env.CB_HALF_OPEN_SUCCESS_THRESHOLD || '3', 10)
        );
    }

    async createUser(name: string, email: string): Promise<User> {
        await this.uow.startTransaction();
        try {
            const existingUser = await this.uow.users.findByEmail(email);
            if (existingUser) {
                const error: any = new Error('Email already exists');
                error.code = 'ER_DUP_ENTRY';
                throw error;
            }

            const user: User = {
                id: uuidv4(),
                name,
                email
            };

            const createdUser = await this.uow.users.create(user);
            await this.uow.commit();
            return createdUser;
        } catch (error) {
            await this.uow.rollback();
            throw error;
        }
    }

    async getUser(id: string): Promise<User | null> {
        await this.uow.startTransaction();
        try {
            const user = await this.uow.users.findById(id);
            await this.uow.commit();
            return user;
        } catch (error) {
            await this.uow.rollback();
            throw error;
        }
    }

    async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
        await this.uow.startTransaction();
        try {
            if (updates.email) {
                const existingUser = await this.uow.users.findByEmail(updates.email);
                if (existingUser && existingUser.id !== id) {
                    const error: any = new Error('Email already exists');
                    error.code = 'ER_DUP_ENTRY';
                    throw error;
                }
            }

            const updatedUser = await this.uow.users.update(id, updates);
            await this.uow.commit();
            return updatedUser;
        } catch (error) {
            await this.uow.rollback();
            throw error;
        }
    }

    async deleteUser(id: string): Promise<boolean> {
        await this.uow.startTransaction();
        try {
            const success = await this.uow.users.delete(id);
            await this.uow.commit();
            return success;
        } catch (error) {
            await this.uow.rollback();
            throw error;
        }
    }

    async getEnrichedUser(id: string): Promise<any> {
        const user = await this.getUser(id);
        if (!user) {
            return null;
        }

        const enrichmentUrl = process.env.ENRICHMENT_SERVICE_URL || 'http://enrichment-service:8081/enrich';
        const timeoutMs = parseInt(process.env.ENRICHMENT_TIMEOUT_MS || '2000', 10);
        const maxAttempts = parseInt(process.env.RETRY_MAX_ATTEMPTS || '3', 10);
        const baseDelayMs = parseInt(process.env.RETRY_BASE_DELAY_MS || '200', 10);

        try {
            const enrichedData = await this.circuitBreaker.execute(async () => {
                return await withRetry(async () => {
                    const response = await axios.get(`${enrichmentUrl}?userId=${id}`, {
                        timeout: timeoutMs
                    });
                    return response.data;
                }, maxAttempts, baseDelayMs);
            });

            return {
                ...user,
                enrichedDataStatus: 'available',
                enrichedData
            };
        } catch (error) {
            // Graceful degradation
            console.warn(`[UserService] Failed to enrich user ${id}. Degrading gracefully.`);
            return {
                ...user,
                enrichedDataStatus: 'unavailable',
                enrichedData: null
            };
        }
    }
}
