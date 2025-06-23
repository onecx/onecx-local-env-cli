export interface OnecxCommand<T> {
  run(data: T): Promise<void> | void;
}
