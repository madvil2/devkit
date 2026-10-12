export const LexA = () => <p className={styles.root}>{t.a}</p> // trailing note
export const LexB = () => (
  <div>
    <span>{t.a}</span> {/* hidden note */}
  </div>
)
export const LexC = () => <p className={styles.root}>Don't panic {/* hidden */}</p>
export const LexD = () => <p className={styles.root}>See https://example.com</p>
export const LexE = () => <p title="a // b">It's {t.a} // text</p>
export const pick = <T,>(value: T) => value / 2
