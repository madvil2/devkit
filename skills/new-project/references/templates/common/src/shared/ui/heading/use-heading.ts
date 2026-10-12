import type { TextSize } from '@/shared/config'

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

const TAGS = { 1: 'h1', 2: 'h2', 3: 'h3', 4: 'h4', 5: 'h5', 6: 'h6' } as const

const DEFAULT_SIZES: Record<HeadingLevel, TextSize> = {
  1: '3xl',
  2: '2xl',
  3: 'xl',
  4: 'lg',
  5: 'md',
  6: 'sm',
}

type UseHeadingParams = {
  level: HeadingLevel
  size?: TextSize
}

export const useHeading = ({ level, size }: UseHeadingParams) => ({
  Tag: TAGS[level],
  resolvedSize: size ?? DEFAULT_SIZES[level],
})
