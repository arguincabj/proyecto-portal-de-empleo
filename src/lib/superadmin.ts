import { User } from '@supabase/supabase-js'

export const SUPERADMIN_EMAILS = ['supadmin@gmail.com']

export function esSuperAdmin(user: User | null | undefined): boolean {
  if (!user) return false
  const email = (user.email ?? '').toLowerCase()
  if (SUPERADMIN_EMAILS.includes(email)) return true
  if (user.user_metadata?.is_superadmin === true || user.user_metadata?.rol === 'superadmin') {
    return true
  }
  return false
}
