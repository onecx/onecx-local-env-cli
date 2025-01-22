import fs from "fs";
import yaml from "js-yaml";
import { logger } from "../../../util/utils";
import { SyncMicroservices } from "../shared/sync-microservices";
import { SyncPermissions } from "../shared/sync-permissions";
import { SyncProducts } from "../shared/sync-products";
import { SharedSyncData, SyncCommand } from "../sync-command";

export interface SyncBFFData extends SharedSyncData {
  productName: string;
  pathToValues: string;
  basePath: string;
}

export class RemoveSyncBFFCommand implements SyncCommand<SyncBFFData> {
  run(data: SyncBFFData): void {
    logger.info("Remove synchronized BFF...");

    // Validate if the values file exists
    if (!fs.existsSync(data.pathToValues)) {
      throw new Error(`Values file not found at path: ${data.pathToValues}`);
    }

    const valuesFile = fs.readFileSync(data.pathToValues, "utf8");
    const values = yaml.load(valuesFile) as any;

    // Check if repository is provided or custom name is provided
    if (!values.app.image.repository && !data.name) {
      throw new Error(
        "No repository found in values file and no custom name provided."
      );
    }
    let bffName = data.name ?? "";
    if (values.app.image.repository) {
      bffName = values.app.image.repository.split("/").pop();
    }

    // Permissions
    new SyncPermissions().removeSynchronization(values, {
      ...data,
      customName: bffName,
      roleName: data.role,
    });
    // Microservices
    new SyncMicroservices().removeSynchronization(values, {
      ...data,
      customName: bffName,
    });
    // Products
    new SyncProducts().removeSynchronization(values, {
      ...data,
      icon: data.icon,
    });

    logger.info("BFF removed successfully.");
  }
}
