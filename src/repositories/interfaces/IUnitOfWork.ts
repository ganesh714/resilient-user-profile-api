import { IUserRepository } from './IUserRepository';

export interface IUnitOfWork {
    startTransaction(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    
    get users(): IUserRepository;
}
