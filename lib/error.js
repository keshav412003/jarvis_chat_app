import { NextResponse } from 'next/server';

export function withErrorHandler(handler) {
    return async (req, context) => {
        try {
            return await handler(req, context);
        } catch (error) {
            console.error('API Error:', error);

            if (error.name === 'ZodError') {
                return NextResponse.json({
                    success: false,
                    message: 'Validation failed',
                    errors: error.errors.map(err => ({
                        path: err.path.join('.'),
                        message: err.message
                    })),
                    code: 'VALIDATION_ERROR'
                }, { status: 400 });
            }

            if (error.code === 11000) {
                return NextResponse.json({
                    success: false,
                    message: 'Duplicate entry detected',
                    code: 'DUPLICATE_ERROR'
                }, { status: 409 });
            }

            return NextResponse.json({
                success: false,
                message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
                code: 'INTERNAL_ERROR'
            }, { status: 500 });
        }
    };
}
