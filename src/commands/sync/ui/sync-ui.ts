import fs from "fs";
import { getEnvDirectory, logger, ValuesMapper } from "../../../util/utils";
import { SyncMicroservices } from "../shared/sync-microservices";
import { SyncPermissions } from "../shared/sync-permissions";
import { SyncProducts } from "../shared/sync-products";
import { retrieveValuesYAML } from "../shared/values.utils";
import { SharedSyncData, SyncCommand } from "../sync-command";
import { OneCXValuesSpecification } from "../types";
import { SyncMicrofrontends } from "./sync-microfrontends";
import { SyncSlots } from "./sync-slots";
import { SyncWorkspace } from "./sync-workspace";

export interface SyncUIData extends SharedSyncData {
  productName: string;
  pathToValues: string;
  basePath: string;
}

export class SyncUICommand implements SyncCommand<SyncUIData> {
  async run(data: SyncUIData, valuesMapper?: ValuesMapper): Promise<void> {
    const values = await retrieveValuesYAML(data.pathToValues, data.onecxSectionPath, valuesMapper);
    this.performSync(data, values);
  }

  performSync(data: SyncUIData, values: OneCXValuesSpecification) {
    logger.info("Syncing UI...");    
    // Check if repository is provided or custom name is provided
    if (
      !values?.image?.repository
      && !data.name
    ) {
      throw new Error(
        "No repository found in values file and no custom name provided."
      );
    }
    let uiName = data.name ?? "";
    if (values?.image?.repository && uiName === "") {
      uiName = values.image.repository.split("/").pop() ?? "";
    }
    logger.verbose(`UI name: ${uiName}`);

    // Validate imports directory exists
    const importsDirectory = getEnvDirectory("./imports", data.env);
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
      type: "ui",
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
