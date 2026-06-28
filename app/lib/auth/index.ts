//file: restaurantAdmin/admin-dashboard/app/lib/auth/index.ts
import { createNeonAuth } from '@neondatabase/auth/next/server';


export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
});