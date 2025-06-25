import { ValuesMapper } from "../util/utils";

export interface OnecxCommand<T> {
  run(data: T, valuesMapper?: ValuesMapper): Promise<void> | void;
}
