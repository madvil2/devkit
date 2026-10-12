type Props = {
  format: <V>(value: V) => string
}
// legacy helper, remove after migration
const f: <T>(x: T) => T = (x) => x
// after
interface P { <T>(x: T): T }
// after interface
type K<T> = T extends string ? <U>() => U : never
// after conditional
const g = <const T,>(x: T) => x
// after const generic
export const S = () => <Select<Option> options={opts} />
// TODO remove
export const D = () => <p className={styles.root}>See https://example.com</p>
