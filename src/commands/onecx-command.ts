export interface OnecxCommand<T> {
  run(data: T): void;
}
