import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(`[Error] ${err.message}`, err);

    // Duplicate entry (MySQL unique constraint)
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            errorCode: 'CONFLICT',
            message: 'A resource with that unique identifier already exists.',
            details: []
        });
    }

    // Default 500 error
    return res.status(500).json({
        errorCode: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred.',
        details: []
    });
};
