import { FieldValues, UseFormSetError } from 'react-hook-form';

export interface MutationExtraArg<T extends FieldValues> {
  data: T;
  setError?: UseFormSetError<T>;
}
