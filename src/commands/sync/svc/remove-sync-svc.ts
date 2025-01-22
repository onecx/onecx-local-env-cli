import fs from "fs";
import yaml from "js-yaml";
import { OnecxCommand } from "../../onecx-command";
import { SyncMicroservices } from "../shared/sync-microservices";
import { SyncProducts } from "../shared/sync-products";
import { logger } from "../../../util/utils";

export interface SyncSVCData {
  productName: string;
  pathToValues: string;
  basePath: string;
}

export class RemoveSyncSVCCommand implements OnecxCommand<SyncSVCData> {
  run(data: SyncSVCData, options: { [key: string]: string }): void {
    logger.info("Remove synchronized SVC...");

    // Validate if the values file exists
    if (!fs.existsSync(data.pathToValues)) {
      throw new Error(`Values file not found at path: ${data.pathToValues}`);
    }

    const valuesFile = fs.readFileSync(data.pathToValues, "utf8");
    const values = yaml.load(valuesFile) as any;

    // Check if repository is provided or custom name is provided
    if (!values.app.image.repository && !options["name"]) {
      throw new Error(
        "No repository found in values file and no custom name provided."
      );
    }
    let svcName = options["name"];
    if (values.app.image.repository) {
      svcName = values.app.image.repository.split("/").pop();
    }

    // Microservices
    new SyncMicroservices().removeSynchronization(
      values,
      {
        ...data,
        customName: svcName,
      },
      options
    );
    // Products
    new SyncProducts().removeSynchronization(
      values,
      {
        ...data,
        icon: options["icon"],
      },
      options
    );

    logger.info("Removal of synchronized SVC successfull.");
  }
}
