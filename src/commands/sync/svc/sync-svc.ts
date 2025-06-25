import { logger, ValuesMapper } from "../../../util/utils";
import { SyncMicroservices } from "../shared/sync-microservices";
import { SyncProducts } from "../shared/sync-products";
import { retrieveValuesYAML } from "../shared/values.utils";
import { SharedSyncData, SyncCommand } from "../sync-command";
import { OneCXValuesSpecification } from "../types";

export interface SyncSVCData extends SharedSyncData {
  productName: string;
  pathToValues: string;
  basePath: string;
}

export class SyncSVCCommand implements SyncCommand<SyncSVCData> {
  run(data: SyncSVCData, valuesMapper?: ValuesMapper): void {
    retrieveValuesYAML(data.pathToValues, data.onecxSectionPath, valuesMapper)
      .then((values) => {
        this.performSync(data, values);
      })
      .catch((r) => {
        logger.error(r.message);
      });
  }

  performSync(data: SyncSVCData, values: OneCXValuesSpecification) {
    logger.info("Syncing SVC...");

    // Check if repository is provided or custom name is provided
    if (!values.image.repository && !data.name) {
      throw new Error(
        "No repository found in values file and no custom name provided."
      );
    }
    let svcName = data.name ?? "";
    if (values.image.repository) {
      svcName = values.image.repository.split("/").pop() ?? "";
    }

    // Microservices
    new SyncMicroservices().synchronize(values, {
      ...data,
      customName: svcName,
      type: "svc",
    });
    // Products
    new SyncProducts().synchronize(values, {
      ...data,
      icon: data.icon,
    });

    logger.info("SVC synchronized successfully.");
  }
}
