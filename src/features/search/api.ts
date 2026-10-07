export type Product = {
  id: number
  title: string
  description: string
  category: string
  price: number
  thumbnail: string
}

export type ProductSearchResponse = {
  products: Product[]
  total: number
}

export const PRODUCT_SEARCH_URL = 'https://dummyjson.com/products/search'

function isProduct(value: unknown): value is Product {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'number' &&
    'title' in value &&
    typeof value.title === 'string' &&
    'description' in value &&
    typeof value.description === 'string' &&
    'category' in value &&
    typeof value.category === 'string' &&
    'price' in value &&
    typeof value.price === 'number' &&
    'thumbnail' in value &&
    typeof value.thumbnail === 'string'
  )
}

function isProductSearchResponse(value: unknown): value is ProductSearchResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'products' in value &&
    Array.isArray(value.products) &&
    value.products.every(isProduct) &&
    'total' in value &&
    typeof value.total === 'number'
  )
}

export async function searchProducts(query: string, signal: AbortSignal): Promise<Product[]> {
  const response = await fetch(`${PRODUCT_SEARCH_URL}?q=${encodeURIComponent(query)}`, { signal })
  if (!response.ok) {
    throw new Error(`Search failed with status ${response.status}`)
  }
  const body: unknown = await response.json()
  if (!isProductSearchResponse(body)) {
    throw new Error('Search returned an unexpected response shape')
  }
  return body.products
}
