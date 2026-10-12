import '@/shared/styles/global.css'

import('@/app/bootstrap')
  .then(({ bootstrap }) => bootstrap())
  .catch((error: unknown) => {
    console.error(error)
  })
