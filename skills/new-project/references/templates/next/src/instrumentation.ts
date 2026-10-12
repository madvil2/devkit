export const register = async () => {
  const { assertEnv } = await import('@/shared/config/env.server')
  assertEnv()
}
