export type Role = 'user' | 'admin'

export type User = {
  id: number
  username: string
  name: string
  role: Role
}

export type Order = {
  id: number
  item: string
  total: number
  placedAt: string
}

export type AdminStats = {
  users: number
  orders: number
  revenue: number
}

export type Session = {
  accessToken: string
  user: User
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function isUser(value: unknown): value is User {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    typeof value.username === 'string' &&
    typeof value.name === 'string' &&
    (value.role === 'user' || value.role === 'admin')
  )
}

function isOrder(value: unknown): value is Order {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    typeof value.item === 'string' &&
    typeof value.total === 'number' &&
    typeof value.placedAt === 'string'
  )
}

export function isOrderList(value: unknown): value is Order[] {
  return Array.isArray(value) && value.every(isOrder)
}

export function isAdminStats(value: unknown): value is AdminStats {
  return (
    isRecord(value) &&
    typeof value.users === 'number' &&
    typeof value.orders === 'number' &&
    typeof value.revenue === 'number'
  )
}

export function isSession(value: unknown): value is Session {
  return isRecord(value) && typeof value.accessToken === 'string' && isUser(value.user)
}
