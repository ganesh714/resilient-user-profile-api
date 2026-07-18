import { User } from '../../models/User';

export interface IUserRepository {
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    create(user: User): Promise<User>;
    update(id: string, updates: Partial<User>): Promise<User | null>;
    delete(id: string): Promise<boolean>;
}
