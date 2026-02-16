import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/error';

export const POST = withErrorHandler(async (req) => {
    const response = NextResponse.json(
        { success: true },
        {
            status: 200,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                'Clear-Site-Data': '"cookies", "storage"'
            },
        }
    );

    response.cookies.set('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        expires: new Date(0),
        path: '/'
    });

    return response;
});
