import type { RegistrationValues } from './types.ts'

export const REGISTER_URL = 'https://dummyjson.com/users/add'

type RegisterResponse = {
  id: number
}

function isRegisterResponse(value: unknown): value is RegisterResponse {
  return typeof value === 'object' && value !== null && 'id' in value && typeof value.id === 'number'
}

export async function registerUser(values: RegistrationValues): Promise<number> {
  const response = await fetch(REGISTER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: values.email.trim(),
      password: values.password,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      phone: values.phone.trim(),
    }),
  })
  if (!response.ok) {
    throw new Error(`Registration failed with status ${response.status}`)
  }
  const body: unknown = await response.json()
  if (!isRegisterResponse(body)) {
    throw new Error('Registration returned an unexpected response shape')
  }
  return body.id
}
