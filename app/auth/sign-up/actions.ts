// app/auth/sign-up/actions.ts
'use server';
import { auth } from '@/app/lib/auth/server';

export async function signUp(formData: FormData) {
  const { data, error } = await auth.signUp.email({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    name: formData.get('name') as string,
  });

  if (error) {
    return { error: error.message };
  }

  return { data };
}