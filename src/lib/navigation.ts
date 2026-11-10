// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getHomeHref(_rol?: string): string {
  return '/'
}

export function getDashboardHref(rol?: string): string {
  if (rol === 'superadmin') return '/superadmin'
  if (rol === 'empresa') return '/empresa'
  if (rol === 'municipalidad') return '/admin'
  return '/inicio'
}
