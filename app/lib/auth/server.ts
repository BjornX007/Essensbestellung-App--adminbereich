// This file is used to configure the Neon Auth server-side functionality for the application. It imports the necessary function from the '@neondatabase/auth/next/server' package and sets up the authentication configuration using environment variables for the base URL and cookie secret.
//file: restaurantAdmin/admin-dashboard/app/lib/auth/server.ts
import { createNeonAuth } from '@neondatabase/auth/next/server';

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
});

