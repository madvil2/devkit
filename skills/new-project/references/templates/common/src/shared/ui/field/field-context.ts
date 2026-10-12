import { createContext, useContext } from 'react'

export type FieldControl = {
  controlId: string
  describedBy: string | undefined
  invalid: boolean
}

export const FieldContext = createContext<FieldControl | null>(null)

export const useFieldControl = (): FieldControl | null => useContext(FieldContext)
