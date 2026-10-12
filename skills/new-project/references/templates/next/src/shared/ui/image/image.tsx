import NextImage, { type ImageProps as NextImageProps } from 'next/image'
import { cx } from '@/shared/lib/cx'
import styles from './image.module.css'

export type ImageProps = Pick<
  NextImageProps,
  | 'src'
  | 'alt'
  | 'width'
  | 'height'
  | 'fill'
  | 'sizes'
  | 'preload'
  | 'quality'
  | 'placeholder'
  | 'blurDataURL'
> & {
  fit?: 'cover' | 'contain'
  className?: string
}

export const Image = ({ fit = 'cover', className, ...rest }: ImageProps) => (
  <NextImage {...rest} className={cx(styles.root, className)} data-fit={fit} />
)
