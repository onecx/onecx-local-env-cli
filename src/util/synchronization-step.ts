export interface SynchronizationStep<T> {
  synchronize(values: any, input: T): void;
  removeSynchronization(values: any, input: T): void;
}
