import express from 'express';
import { UserController, createUserSchema, updateUserSchema } from './controllers/UserController';
import { validate } from './middleware/validate';
import { errorHandler } from './middleware/errorHandler';

const app = express();
app.use(express.json());

const userController = new UserController();

// Routes
app.post('/api/users', validate(createUserSchema), userController.createUser);
app.get('/api/users/:id', userController.getUser);
app.put('/api/users/:id', validate(updateUserSchema), userController.updateUser);
app.delete('/api/users/:id', userController.deleteUser);
app.get('/api/users/:id/enriched', userController.getEnrichedUser);

// Global Error Handler
app.use(errorHandler);

export default app;
