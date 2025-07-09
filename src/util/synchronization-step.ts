import { OneCXValuesSpecification } from "../commands/sync/types";

export interface SynchronizationStep<T> {
  synchronize(values: OneCXValuesSpecification, input: T): void;
  removeSynchronization(values: OneCXValuesSpecification, input: T): void;
}
