export type User = {
  id: string
  firstName: string
  lastName: string
  gender: string
  age: number
  email: string
  city: string
  country: string
  registeredAt: string
  pictureUrl: string
}

export const USERS_URL =
  'https://randomuser.me/api/?results=500&seed=fe-interview-prep&inc=gender,name,location,email,login,dob,registered,picture&noinfo'

type RandomUser = {
  gender: string
  name: { first: string; last: string }
  location: { city: string; country: string }
  email: string
  login: { uuid: string }
  dob: { age: number }
  registered: { date: string }
  picture: { thumbnail: string }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function hasString(value: Record<string, unknown>, key: string): boolean {
  return typeof value[key] === 'string'
}

function isRandomUser(value: unknown): value is RandomUser {
  if (!isRecord(value) || !hasString(value, 'gender') || !hasString(value, 'email')) return false
  const { name, location, login, dob, registered, picture } = value
  return (
    isRecord(name) &&
    hasString(name, 'first') &&
    hasString(name, 'last') &&
    isRecord(location) &&
    hasString(location, 'city') &&
    hasString(location, 'country') &&
    isRecord(login) &&
    hasString(login, 'uuid') &&
    isRecord(dob) &&
    typeof dob.age === 'number' &&
    isRecord(registered) &&
    typeof registered.date === 'string' &&
    !Number.isNaN(Date.parse(registered.date)) &&
    isRecord(picture) &&
    hasString(picture, 'thumbnail')
  )
}

function isUsersResponse(value: unknown): value is { results: RandomUser[] } {
  return isRecord(value) && Array.isArray(value.results) && value.results.every(isRandomUser)
}

function toUser(raw: RandomUser): User {
  return {
    id: raw.login.uuid,
    firstName: raw.name.first,
    lastName: raw.name.last,
    gender: raw.gender,
    age: raw.dob.age,
    email: raw.email,
    city: raw.location.city,
    country: raw.location.country,
    registeredAt: raw.registered.date,
    pictureUrl: raw.picture.thumbnail,
  }
}

export async function fetchUsers(signal: AbortSignal): Promise<User[]> {
  const response = await fetch(USERS_URL, { signal })
  if (!response.ok) {
    throw new Error(`Loading people failed with status ${response.status}`)
  }
  const body: unknown = await response.json()
  if (!isUsersResponse(body)) {
    throw new Error('People endpoint returned an unexpected response shape')
  }
  return body.results.map(toUser)
}
