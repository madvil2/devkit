import '@/shared/styles/global.css'
import '@/shared/styles/tokens/safe-area.css'

import('@/app/bootstrap')
  .then(({ bootstrap }) => bootstrap())
  .catch((error: unknown) => {
    console.error(error)
  })
