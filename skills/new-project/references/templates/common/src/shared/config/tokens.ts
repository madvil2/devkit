export const SPACE_TOKENS = ['3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const
export type SpaceToken = (typeof SPACE_TOKENS)[number]

export const TEXT_SIZES = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'] as const
export type TextSize = (typeof TEXT_SIZES)[number]

export const TONES = [
  'default',
  'muted',
  'subtle',
  'accent',
  'success',
  'warning',
  'danger',
] as const
export type Tone = (typeof TONES)[number]
