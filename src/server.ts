import app from './app';
import * as dotenv from 'dotenv';
import pool from './config/database';

dotenv.config();

const PORT = process.env.PORT || 8080;

const startServer = async () => {
    try {
        // Test database connection
        const connection = await pool.getConnection();
        console.log('Successfully connected to the database.');
        connection.release();

        app.listen(PORT, () => {
            console.log(`API Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to connect to the database. Exiting...', error);
        process.exit(1);
    }
};

startServer();
