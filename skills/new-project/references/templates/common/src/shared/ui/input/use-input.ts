import { useFieldControl } from '@/shared/ui/field'

type UseInputParams = {
  id?: string
}

export const useInput = ({ id }: UseInputParams) => {
  const control = useFieldControl()
  return {
    controlId: id ?? control?.controlId,
    describedBy: control?.describedBy,
    invalid: control?.invalid ? true : undefined,
  }
}
