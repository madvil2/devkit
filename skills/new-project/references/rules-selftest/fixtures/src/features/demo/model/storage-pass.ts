import { storage } from '@/shared/lib/storage'
export const read = () => storage.get('k')
export const obj = { localStorage: 1 }
