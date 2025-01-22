export interface SynchronizationStepOptions {
  dry?: boolean;
  env?: string | undefined;
}

export interface SynchronizationStep<T> {
  synchronize(values: any, input: T, options: SynchronizationStepOptions): void;
  removeSynchronization(values: any, input: T, options: SynchronizationStepOptions): void;
}
