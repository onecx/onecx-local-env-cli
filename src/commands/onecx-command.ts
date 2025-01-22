export interface OnecxCommand<T> {
  run(data: T, options: { [key: string]: string }): void;
}
