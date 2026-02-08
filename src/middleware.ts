import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const response = NextResponse.next()
    
    const token = request.cookies.get('access_token');
    const role = request.cookies.get('user_type');

    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Content-Security-Policy', "frame-ancestors 'self'");

    if (pathname.startsWith('/base-user')) {
        if (!token?.value || !role?.value) {
            return NextResponse.redirect(new URL('/signin', request.url));
        }
        if (role.value !== 'BASE_USER') {
            return NextResponse.redirect(new URL('/signin', request.url));
        }
    }
    
    // If accessing practitioner routes
    // if (pathname.startsWith('/practitioner')) {
    //     if (!token || !role) {
    //         return NextResponse.redirect(new URL('/', request.url));
    //     }
    //     if (role !== 'practitioner') {
    //         return NextResponse.redirect(new URL('/lawyer', request.url));
    //     }
    // }
    
    return NextResponse.next();
}