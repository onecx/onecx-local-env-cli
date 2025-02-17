import { ValuesSpecification } from "../commands/sync/types";

export interface SynchronizationStep<T> {
  synchronize(values: ValuesSpecification, input: T): void;
  removeSynchronization(values: ValuesSpecification, input: T): void;
}
