import { OnecxCommand } from "../onecx-command";

export interface SharedSyncData {
  productName: string;
  env: string;  
  role: string;
  icon: string;
  dry: boolean;
  remove: boolean;
  verbose: boolean;
  name?: string;
}

export interface SyncCommand<T extends SharedSyncData> extends OnecxCommand<T> {
  run(data: T): void;
}
