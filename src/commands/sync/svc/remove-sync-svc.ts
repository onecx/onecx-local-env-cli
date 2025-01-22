import fs from "fs";
import yaml from "js-yaml";
import { logger } from "../../../util/utils";
import { OnecxCommand } from "../../onecx-command";
import { SyncMicroservices } from "../shared/sync-microservices";
import { SyncProducts } from "../shared/sync-products";
import { SharedSyncData } from "../sync-command";

export interface SyncSVCData extends SharedSyncData {
  productName: string;
  pathToValues: string;
  basePath: string;
}

export class RemoveSyncSVCCommand implements OnecxCommand<SyncSVCData> {
  run(data: SyncSVCData): void {
    logger.info("Remove synchronized SVC...");

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
    let svcName = data.name ?? "";
    if (values.app.image.repository) {
      svcName = values.app.image.repository.split("/").pop();
    }

    // Microservices
    new SyncMicroservices().removeSynchronization(values, {
      ...data,
      customName: svcName,
    });
    // Products
    new SyncProducts().removeSynchronization(values, {
      ...data,
      icon: data.icon,
    });

    logger.info("Removal of synchronized SVC successfull.");
  }
}
