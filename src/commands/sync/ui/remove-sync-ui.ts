import fs from "fs";
import yaml from "js-yaml";
import { logger } from "../../../util/utils";
import { SyncMicroservices } from "../shared/sync-microservices";
import { SyncPermissions } from "../shared/sync-permissions";
import { SyncProducts } from "../shared/sync-products";
import { SharedSyncData, SyncCommand } from "../sync-command";
import { SyncMicrofrontends } from "./sync-microfrontends";
import { SyncSlots } from "./sync-slots";
export interface SyncUIData extends SharedSyncData {
  productName: string;
  pathToValues: string;
  basePath: string;
}

export class RemoveSyncUICommand implements SyncCommand<SyncUIData> {
  run(data: SyncUIData): void {
    logger.info("Remove synchronized UI...");

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
    let uiName = data.name ?? "";
    if (values.app.image.repository) {
      uiName = values.app.image.repository.split("/").pop();
    }

    // Microfrontends
    new SyncMicrofrontends().removeSynchronization(values, {
      ...data,
      uiName,
    });
    // Permissions
    new SyncPermissions().removeSynchronization(values, {
      ...data,
      customName: uiName,
      roleName: data.role,
    });
    // Microservices
    new SyncMicroservices().removeSynchronization(values, {
      ...data,
      customName: uiName,
    });

    // Products
    new SyncProducts().removeSynchronization(values, {
      ...data,
      icon: data.icon,
    });
    // Slots
    new SyncSlots().removeSynchronization(values, {
      ...data,
      uiName,
    });

    logger.info("Removal of synchronized UI successfull.");
  }
}
