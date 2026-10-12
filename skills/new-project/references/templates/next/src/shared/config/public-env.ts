export const PUBLIC_ENV = {
  API_MODE: process.env.NEXT_PUBLIC_API_MODE,
  API_URL: process.env.NEXT_PUBLIC_API_URL,
}

export const MOCK_API = process.env.NEXT_PUBLIC_API_MODE === 'mock'
