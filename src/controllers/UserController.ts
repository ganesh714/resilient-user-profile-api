import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { UserService } from '../services/UserService';
import { MySQLUnitOfWork } from '../repositories/implementations/MySQLUnitOfWork';

export const createUserSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email format')
    })
});

export const updateUserSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name cannot be empty').optional(),
        email: z.string().email('Invalid email format').optional()
    })
});

export class UserController {
    // We instantiate dependencies here for simplicity, typically done via DI container
    private userService = new UserService(new MySQLUnitOfWork());

    createUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { name, email } = req.body;
            const user = await this.userService.createUser(name, email);
            res.status(201).json(user);
        } catch (error) {
            next(error);
        }
    };

    getUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const user = await this.userService.getUser(id as string);
            if (!user) {
                return res.status(404).json({
                    errorCode: 'NOT_FOUND',
                    message: 'User not found'
                });
            }
            res.status(200).json(user);
        } catch (error) {
            next(error);
        }
    };

    updateUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const updates = req.body;
            const user = await this.userService.updateUser(id as string, updates);
            if (!user) {
                return res.status(404).json({
                    errorCode: 'NOT_FOUND',
                    message: 'User not found'
                });
            }
            res.status(200).json(user);
        } catch (error) {
            next(error);
        }
    };

    deleteUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const success = await this.userService.deleteUser(id as string);
            if (!success) {
                return res.status(404).json({
                    errorCode: 'NOT_FOUND',
                    message: 'User not found'
                });
            }
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    getEnrichedUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const enrichedUser = await this.userService.getEnrichedUser(id as string);
            if (!enrichedUser) {
                return res.status(404).json({
                    errorCode: 'NOT_FOUND',
                    message: 'User not found'
                });
            }
            res.status(200).json(enrichedUser);
        } catch (error) {
            next(error);
        }
    };
}
