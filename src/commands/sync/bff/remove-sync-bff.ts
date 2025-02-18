import { logger } from "../../../util/utils";
import { SyncMicroservices } from "../shared/sync-microservices";
import { SyncPermissions } from "../shared/sync-permissions";
import { SyncProducts } from "../shared/sync-products";
import { retrieveValuesYAML } from "../shared/values.utils";
import { SharedSyncData, SyncCommand } from "../sync-command";
import { ValuesSpecification } from "../types";

export interface SyncBFFData extends SharedSyncData {
  productName: string;
  pathToValues: string;
  basePath: string;
}

export class RemoveSyncBFFCommand implements SyncCommand<SyncBFFData> {
  run(data: SyncBFFData): void {
    retrieveValuesYAML(data.pathToValues)
      .then((values) => {
        this.performSync(data, values as ValuesSpecification);
      })
      .catch((r) => {
        logger.error(r.message);
      });
  }

  performSync(data: SyncBFFData, values: ValuesSpecification) {
    logger.info("Remove synchronized BFF...");

    // Check if repository is provided or custom name is provided
    if (!values.app.image.repository && !data.name) {
      throw new Error(
        "No repository found in values file and no custom name provided."
      );
    }
    let bffName = data.name ?? "";
    if (values.app.image.repository) {
      bffName = values.app.image.repository.split("/").pop() ?? "";
    }

    // Permissions
    new SyncPermissions().removeSynchronization(values, {
      ...data,
      appName: bffName,
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
