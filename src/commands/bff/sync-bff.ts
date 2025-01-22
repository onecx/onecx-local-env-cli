import fs from "fs";
import yaml from "js-yaml";
import { OnecxCommand } from "../onecx-command";
import { SyncMicroservices } from "../sync/shared/sync-microservices";
import { SyncPermissions } from "../sync/shared/sync-permissions";
import { SyncProducts } from "../sync/shared/sync-products";
import { logger } from "../../util/utils";

export interface SyncBFFData {
  productName: string;
  pathToValues: string;
  basePath: string;
}

export class SyncBFFCommand implements OnecxCommand<SyncBFFData> {
  run(data: SyncBFFData, options: { [key: string]: string }): void {
    logger.info("Syncing BFF...");

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
    let bffName = options["name"];
    if (values.app.image.repository) {
      bffName = values.app.image.repository.split("/").pop();
    }

    // Permissions
    new SyncPermissions().synchronize(
      values,
      {
        ...data,
        customName: bffName,
        roleName: options["role"],
      },
      options
    );
    // Microservices
    new SyncMicroservices().synchronize(
      values,
      {
        ...data,
        customName: bffName,
      },
      options
    );
    // Products
    new SyncProducts().synchronize(
      values,
      {
        ...data,
        icon: options["icon"],
      },
      options
    );

    logger.info("BFF synchronized successfully.");
  }
}
