import '@/shared/styles/global.css'
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { DEFAULT_LOCALE } from '@/shared/i18n'
import { PRE_PAINT_SCRIPT } from '@/shared/lib/theme'
import { rootMetadata, rootViewport } from '@/shared/seo/metadata'
import { fontVariables } from './fonts'
import { Providers } from './providers'

type RootLayoutProps = {
  children: ReactNode
}

export const metadata: Metadata = rootMetadata()

export const viewport: Viewport = rootViewport()

const RootLayout = ({ children }: RootLayoutProps) => (
  <html lang={DEFAULT_LOCALE} className={fontVariables} suppressHydrationWarning>
    <head>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: the pre-paint theme script is a static string owned by the app (NXT-10) */}
      <script dangerouslySetInnerHTML={{ __html: PRE_PAINT_SCRIPT }} />
    </head>
    <body>
      <Providers>{children}</Providers>
    </body>
  </html>
)

export default RootLayout
