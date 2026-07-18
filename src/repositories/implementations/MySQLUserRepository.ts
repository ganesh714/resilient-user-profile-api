import { Connection } from 'mysql2/promise';
import { IUserRepository } from '../interfaces/IUserRepository';
import { User } from '../../models/User';

export class MySQLUserRepository implements IUserRepository {
    private connection: Connection;

    constructor(connection: Connection) {
        this.connection = connection;
    }

    async findById(id: string): Promise<User | null> {
        const [rows]: any = await this.connection.execute(
            'SELECT id, name, email, registrationDate FROM users WHERE id = ?',
            [id]
        );
        if (rows.length === 0) return null;
        return rows[0] as User;
    }

    async findByEmail(email: string): Promise<User | null> {
        const [rows]: any = await this.connection.execute(
            'SELECT id, name, email, registrationDate FROM users WHERE email = ?',
            [email]
        );
        if (rows.length === 0) return null;
        return rows[0] as User;
    }

    async create(user: User): Promise<User> {
        await this.connection.execute(
            'INSERT INTO users (id, name, email) VALUES (?, ?, ?)',
            [user.id, user.name, user.email]
        );
        
        // Retrieve the created user to get the auto-generated registrationDate
        const createdUser = await this.findById(user.id);
        if (!createdUser) {
             throw new Error('Failed to retrieve created user');
        }
        return createdUser;
    }

    async update(id: string, updates: Partial<User>): Promise<User | null> {
        const fields = [];
        const values = [];
        
        if (updates.name) {
            fields.push('name = ?');
            values.push(updates.name);
        }
        
        if (updates.email) {
            fields.push('email = ?');
            values.push(updates.email);
        }
        
        if (fields.length === 0) {
            return this.findById(id); // Nothing to update
        }

        values.push(id);
        
        await this.connection.execute(
            `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        
        return this.findById(id);
    }

    async delete(id: string): Promise<boolean> {
        const [result]: any = await this.connection.execute(
            'DELETE FROM users WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }
}
