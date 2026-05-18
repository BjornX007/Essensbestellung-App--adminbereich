import { NextRequest, NextResponse } from 'next/server';

const protectedRoutes = ['/dashboard', '/settings'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('PATH:', pathname);
  console.log('COOKIES:', request.cookies.getAll().map(c => c.name));

  const isProtected = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const cookies = request.cookies.getAll();
  const hasSession = cookies.some(c => 
    c.name.includes('session') || 
    c.name.includes('auth') || 
    c.name.includes('token')
  );

  if (!hasSession) {
    return NextResponse.redirect(new URL('/auth/sign-in', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*'],
};