import fs from "fs";
import yaml from "js-yaml";
import { logger } from "../../../util/utils";
import { OnecxCommand } from "../../onecx-command";
import { SyncMicroservices } from "../shared/sync-microservices";
import { SyncPermissions } from "../shared/sync-permissions";
import { SyncProducts } from "../shared/sync-products";
import { SyncMicrofrontends } from "./sync-microfrontends";
import { SyncSlots } from "./sync-slots";
export interface SyncUIData {
  productName: string;
  pathToValues: string;
  basePath: string;
}

export class RemoveSyncUICommand implements OnecxCommand<SyncUIData> {
  run(data: SyncUIData, options: { [key: string]: string }): void {
    logger.info("Remove synchronized UI...");

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
    let uiName = options["name"];
    if (values.app.image.repository) {
      uiName = values.app.image.repository.split("/").pop();
    }

    // Microfrontends
    new SyncMicrofrontends().removeSynchronization(
      values,
      {
        ...data,
        uiName,
      },
      options
    );
    // Permissions
    new SyncPermissions().removeSynchronization(
      values,
      {
        ...data,
        customName: uiName,
        roleName: options["role"],
      },
      options
    );
    // Microservices
    new SyncMicroservices().removeSynchronization(
      values,
      {
        ...data,
        customName: uiName,
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
    // Slots
    new SyncSlots().removeSynchronization(
      values,
      {
        ...data,
        uiName,
      },
      options
    );

    logger.info("Removal of synchronized UI successfull.");
  }
}
