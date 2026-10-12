export const PUBLIC_ENV = {
  API_MODE: import.meta.env.VITE_API_MODE,
  API_URL: import.meta.env.VITE_API_URL,
}

export const MOCK_API = import.meta.env.VITE_API_MODE === 'mock'
