import fs from "fs";
import yaml from "js-yaml";
import { getImportsDirectory, logger } from "../../../util/utils";
import { OnecxCommand } from "../../onecx-command";
import { SyncMicroservices } from "../shared/sync-microservices";
import { SyncPermissions } from "../shared/sync-permissions";
import { SyncProducts } from "../shared/sync-products";
import { SyncMicrofrontends } from "./sync-microfrontends";
import { SyncSlots } from "./sync-slots";
import { SyncWorkspace } from "./sync-workspace";
export interface SyncUIData {
  productName: string;
  pathToValues: string;
  basePath: string;
}

export class SyncUICommand implements OnecxCommand<SyncUIData> {
  run(data: SyncUIData, options: { [key: string]: string }): void {
    logger.info("Syncing UI...");

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

    // Validate imports directory exists
    let importsDirectory = getImportsDirectory("./imports", options.env);
    if (!fs.existsSync(importsDirectory)) {
      throw new Error(
        `Imports directory not found at path: ${importsDirectory}`
      );
    }

    // Microfrontends
    new SyncMicrofrontends().synchronize(
      values,
      {
        ...data,
        uiName,
      },
      options
    );
    // Permissions
    new SyncPermissions().synchronize(
      values,
      {
        ...data,
        customName: uiName,
        roleName: options["role"],
      },
      options
    );
    // Microservices
    new SyncMicroservices().synchronize(
      values,
      {
        ...data,
        customName: uiName,
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
    // Slots
    new SyncSlots().synchronize(
      values,
      {
        ...data,
        uiName,
      },
      options
    );
    // Workspace
    new SyncWorkspace().synchronize(
      values,
      {
        ...data,
        uiName,
      },
      options
    );
    logger.info("UI synchronized successfully.");
  }
}
