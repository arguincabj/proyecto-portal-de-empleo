export { cn } from "cn"

/**
 * Formatea un monto numérico a formato monetario legible en pesos argentinos ($ ARS).
 * Retorna null si el valor no está definido o no es un número válido.
 */
export function formatearSalario(monto: number | string | null | undefined): string | null {
  if (monto === null || monto === undefined || monto === '') return null
  const num = typeof monto === 'number' ? monto : Number(monto)
  if (isNaN(num) || num <= 0) return null
  return `$ ${num.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
}
