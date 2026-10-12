export const load = () => request('/users')
export const load2 = (id: string) => request(`/users/${id}`)
