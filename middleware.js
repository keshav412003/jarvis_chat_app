import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Get secret from environment or matching fallback (WARNING: Fallback is insecure for prod)
const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'fallback_secret'
);

export async function middleware(req) {
    const token = req.cookies.get('token')?.value;
    const { pathname } = req.nextUrl;

    // Define protected routes pattern
    const isProtectedRoute =
        pathname.startsWith('/chat') ||
        pathname.startsWith('/status') ||
        pathname.startsWith('/people') ||
        pathname.startsWith('/api/chats') ||
        pathname.startsWith('/api/users');

    // Define auth routes (public but distinct)
    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');

    // Root path handling
    const isRoot = pathname === '/';

    // Verify Token Function (Edge Compatible)
    let isValidToken = false;
    let decodedPayload = null;
    if (token) {
        try {
            const { payload } = await jwtVerify(token, JWT_SECRET);
            isValidToken = true;
            decodedPayload = payload;
        } catch (err) {
            console.error("Middleware Token Verification Failed:", err.message);
            isValidToken = false;
        }
    }

    // Redirect legacy/conflicting plural routes to singular
    if (pathname === '/chats' || pathname.startsWith('/chats/')) {
        const newPathname = pathname.replace('/chats', '/chat');
        return NextResponse.redirect(new URL(newPathname, req.url));
    }

    // CASE 1: Protected Route & Invalid Token
    if (isProtectedRoute && !isValidToken) {
        // For API routes, return JSON 401 instead of redirecting
        if (pathname.startsWith('/api/')) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Authentication required' },
                { status: 401 }
            );
        }

        // For page routes, redirect to home
        const response = NextResponse.redirect(new URL('/', req.url));
        if (token) {
            response.cookies.delete('token');
        }
        return response;
    }

    // CASE 2: Auth Route (Login/Register) & Valid Token -> Redirect to chat
    if (isAuthRoute && isValidToken) {
        return NextResponse.redirect(new URL('/', req.url));
    }

    // CASE 3: Root Path Handling
    if (isRoot) {
        if (isValidToken) {
            return NextResponse.redirect(new URL('/chat', req.url));
        } else {
            return NextResponse.next();
        }
    }

    // Default Allow
    const response = NextResponse.next();

    // Add Security Headers
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'origin-when-cross-origin');

    // Add Cache-Control headers for protected routes and API
    // This is crucial to prevent back-button access to cached pages
    if (isProtectedRoute) {
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
    }

    return response;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
