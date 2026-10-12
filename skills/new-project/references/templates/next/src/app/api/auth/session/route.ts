import { signIn, signOut } from '@/shared/auth/session-handlers.server'

export const POST = signIn
export const DELETE = signOut
