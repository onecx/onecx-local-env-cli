import { logger, ValuesMapper } from "../../../util/utils";
import { SyncMicroservices } from "../shared/sync-microservices";
import { SyncPermissions } from "../shared/sync-permissions";
import { SyncProducts } from "../shared/sync-products";
import { retrieveValuesYAML } from "../shared/values.utils";
import { SyncCommand } from "../sync-command";
import { OneCXValuesSpecification } from "../types";
import { SyncMicrofrontends } from "./sync-microfrontends";
import { SyncSlots } from "./sync-slots";
import { SyncUIData } from "./sync-ui";

export class RemoveSyncUICommand implements SyncCommand<SyncUIData> {
  run(data: SyncUIData, valuesMapper?: ValuesMapper): void {
    retrieveValuesYAML(data.pathToValues, data.onecxSectionPath, valuesMapper)
      .then((values) => {
        this.performSync(data, values);
      })
      .catch((r) => {
        logger.error(r.message);
      });
  }

  performSync(data: SyncUIData, values: OneCXValuesSpecification) {
    logger.info("Remove synchronized UI...");

    // Check if repository is provided or custom name is provided
    if (!values.image.repository && !data.name) {
      throw new Error(
        "No repository found in values file and no custom name provided."
      );
    }
    let uiName = data.name ?? "";
    if (values.image.repository) {
      uiName = values.image.repository.split("/").pop() ?? "";
    }

    // Microfrontends
    new SyncMicrofrontends().removeSynchronization(values, {
      ...data,
      uiName,
    });
    // Permissions
    new SyncPermissions().removeSynchronization(values, {
      ...data,
      appName: uiName,
      roleName: data.role,
    });
    // Microservices
    new SyncMicroservices().removeSynchronization(values, {
      ...data,
      customName: uiName,
      type: "ui",
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
