import { logger } from "../../../util/utils";
import { SyncMicroservices } from "../shared/sync-microservices";
import { SyncPermissions } from "../shared/sync-permissions";
import { SyncProducts } from "../shared/sync-products";
import { retrieveValuesYAML } from "../shared/values.utils";
import { SyncCommand } from "../sync-command";
import { OneCXValuesSpecification } from "../types";
import { SyncBFFData } from "./sync-bff";


export class RemoveSyncBFFCommand implements SyncCommand<SyncBFFData> {
  run(data: SyncBFFData): void {
    retrieveValuesYAML(data.pathToValues, data.onecxSectionPath)
      .then((values) => {
        this.performSync(data, values as OneCXValuesSpecification);
      })
      .catch((r) => {
        logger.error(r.message);
      });
  }

  performSync(data: SyncBFFData, values: OneCXValuesSpecification) {
    logger.info("Remove synchronized BFF...");

    // Check if repository is provided or custom name is provided
    if (!values.image.repository && !data.name) {
      throw new Error(
        "No repository found in values file and no custom name provided."
      );
    }
    let bffName = data.name ?? "";
    if (values.image.repository) {
      bffName = values.image.repository.split("/").pop() ?? "";
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
      type: "bff",
    });
    // Products
    new SyncProducts().removeSynchronization(values, {
      ...data,
      icon: data.icon,
    });

    logger.info("BFF removed successfully.");
  }
}
