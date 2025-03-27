import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const session = await getSession(req, res);

    if (!session || !session.user) {
        const loginUrl = new URL('/api/auth/login', req.url);
        loginUrl.searchParams.set('returnTo', req.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }

    return res;
}

// Protect both pages and API routes
export const config = {
    matcher: [
        '/admin/:path*',
        '/home/:path*',
        '/api/chat/:path*',
        // '/api-doc/:path*',
    ],
};