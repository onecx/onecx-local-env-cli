import { logger } from "../../../util/utils";
import { OnecxCommand } from "../../onecx-command";
import { SyncMicroservices } from "../shared/sync-microservices";
import { SyncProducts } from "../shared/sync-products";
import { retrieveValuesYAML } from "../shared/values.utils";
import { SharedSyncData } from "../sync-command";
import { OneCXValuesSpecification } from "../types";

export interface SyncSVCData extends SharedSyncData {
  productName: string;
  pathToValues: string;
  basePath: string;
}

export class RemoveSyncSVCCommand implements OnecxCommand<SyncSVCData> {
  run(data: SyncSVCData): void {
    retrieveValuesYAML(data.pathToValues, data.onecxSectionPath)
      .then((values) => {
        this.performSync(data, values as OneCXValuesSpecification);
      })
      .catch((r) => {
        logger.error(r.message);
      });
  }

  performSync(data: SyncSVCData, values: OneCXValuesSpecification) {
    logger.info("Remove synchronized SVC...");

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
    new SyncMicroservices().removeSynchronization(values, {
      ...data,
      customName: svcName,
      type: "svc",
    });
    // Products
    new SyncProducts().removeSynchronization(values, {
      ...data,
      icon: data.icon,
    });

    logger.info("Removal of synchronized SVC successfull.");
  }
}
