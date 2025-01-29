import fs from "fs";
import yaml from "js-yaml";
import { getImportsDirectory, logger } from "../../../util/utils";
import { SyncMicroservices } from "../shared/sync-microservices";
import { SyncPermissions } from "../shared/sync-permissions";
import { SyncProducts } from "../shared/sync-products";
import { SharedSyncData, SyncCommand } from "../sync-command";
import { SyncMicrofrontends } from "./sync-microfrontends";
import { SyncSlots } from "./sync-slots";
import { SyncWorkspace } from "./sync-workspace";

export interface SyncUIData extends SharedSyncData {
  productName: string;
  pathToValues: string;
  basePath: string;
}

export class SyncUICommand implements SyncCommand<SyncUIData> {
  run(data: SyncUIData): void {
    logger.info("Syncing UI...");

    // Validate if the values file exists
    if (!fs.existsSync(data.pathToValues)) {
      throw new Error(`Values file not found at path: ${data.pathToValues}`);
    }

    const valuesFile = fs.readFileSync(data.pathToValues, "utf8");
    const values = yaml.load(valuesFile) as any;

    // Check if repository is provided or custom name is provided
    if (
      !(
        values &&
        values.app &&
        values.app.image &&
        values.app.image.repository
      ) &&
      !data.name
    ) {
      throw new Error(
        "No repository found in values file and no custom name provided."
      );
    }
    let uiName = data.name ?? "";
    if (values.app.image.repository) {
      uiName = values.app.image.repository.split("/").pop();
    }

    // Validate imports directory exists
    let importsDirectory = getImportsDirectory("./imports", data.env);
    if (!fs.existsSync(importsDirectory)) {
      throw new Error(
        `Imports directory not found at path: ${importsDirectory}`
      );
    }

    // Microfrontends
    new SyncMicrofrontends().synchronize(values, {
      ...data,
      uiName,
    });
    // Permissions
    new SyncPermissions().synchronize(values, {
      ...data,
      appName: uiName,
      roleName: data.role,
    });
    // Microservices
    new SyncMicroservices().synchronize(values, {
      ...data,
      customName: uiName,
    });

    // Products
    new SyncProducts().synchronize(values, {
      ...data,
      icon: data.icon,
    });
    // Slots
    new SyncSlots().synchronize(values, {
      ...data,
      uiName,
    });
    // Workspace
    new SyncWorkspace().synchronize(values, {
      ...data,
      uiName,
    });
    logger.info("UI synchronized successfully.");
  }
}
