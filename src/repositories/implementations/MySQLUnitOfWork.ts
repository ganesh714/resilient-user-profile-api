import { PoolConnection } from 'mysql2/promise';
import { IUnitOfWork } from '../interfaces/IUnitOfWork';
import { IUserRepository } from '../interfaces/IUserRepository';
import { MySQLUserRepository } from './MySQLUserRepository';
import pool from '../../config/database';

export class MySQLUnitOfWork implements IUnitOfWork {
    private connection: PoolConnection | null = null;
    private userRepository: IUserRepository | null = null;

    async startTransaction(): Promise<void> {
        this.connection = await pool.getConnection();
        await this.connection.beginTransaction();
        this.userRepository = new MySQLUserRepository(this.connection);
    }

    async commit(): Promise<void> {
        if (!this.connection) {
            throw new Error('Transaction not started');
        }
        await this.connection.commit();
        this.connection.release();
        this.connection = null;
        this.userRepository = null;
    }

    async rollback(): Promise<void> {
        if (!this.connection) {
             throw new Error('Transaction not started');
        }
        await this.connection.rollback();
        this.connection.release();
        this.connection = null;
        this.userRepository = null;
    }

    get users(): IUserRepository {
        if (!this.userRepository) {
             throw new Error('Transaction not started. Call startTransaction() first.');
        }
        return this.userRepository;
    }
}
