import fs from "fs";
import path from "path";
import {
  SynchronizationStep,
  SynchronizationStepOptions,
} from "../../../util/synchronization-step";
import { getImportsDirectory, logger } from "../../../util/utils";
import { SyncUIData } from "./sync-ui";

export interface SyncWorkspacesParameters extends SyncUIData {
  uiName: string;
}

export class SyncWorkspace
  implements SynchronizationStep<SyncWorkspacesParameters>
{
  synchronize(
    values: any,
    parameters: SyncWorkspacesParameters,
    { dry: dryRun, env }: SynchronizationStepOptions
  ): void {
    let importsDirectory = getImportsDirectory("./imports/workspace/", env);

    if (
      !values.app ||
      !values.app.operator ||
      !values.app.operator.microfrontend
    ) {
      logger.info(
        "No microfrontends found in values file. Skipping synchronization."
      );
      return;
    }

    const workspaceFilePath = path.join(importsDirectory, `onecx_admin.json`);
    const workspaceFile = fs.readFileSync(workspaceFilePath, "utf8");
    const workspace = JSON.parse(workspaceFile);

    let existingProducts = workspace.workspaces.admin.products;
    // Remove existing product if it exists
    existingProducts = existingProducts.filter(
      (product: any) => product.productName !== parameters.productName
    );

    // Create new product
    const newProduct: {
      productName: string;
      baseUrl: string;
      microfrontends: { appId: any; basePath: string }[];
    } = {
      productName: parameters.productName,
      baseUrl: parameters.basePath,
      microfrontends: [],
    };

    const microfrontends = values.app.operator.microfrontend.specs;

    for (const [key, spec] of Object.entries(microfrontends) as [
      string,
      any
    ][]) {
      const microfrontend = {
        appId: spec.remoteName,
        basePath: "/",
      };

      newProduct.microfrontends.push(microfrontend);

      for (let requiredField of ["remoteName"]) {
        if (!spec[requiredField]) {
          logger.warning(
            `Missing required field ${requiredField} in microfrontend spec ${key}, this can cause issues.`
          );
        }
      }
    }

    existingProducts.push(newProduct);
    workspace.workspaces.admin.products = existingProducts;

    if (dryRun) {
      logger.info(
        `Dry Run: Would write to ${workspaceFilePath} with content:`,
        JSON.stringify(workspace, null, 2)
      );
    } else {
      fs.writeFileSync(workspaceFilePath, JSON.stringify(workspace, null, 2));
    }

    logger.info("Microfrontends synchronized successfully.");
  }

  removeSynchronization(
    values: any,
    input: SyncWorkspacesParameters,
    options: SynchronizationStepOptions
  ): void {
    const { dry: dryRun, env } = options;
    let importsDirectory = getImportsDirectory("./imports/workspace/", env);

    if (
      !values.app ||
      !values.app.operator ||
      !values.app.operator.microfrontend
    ) {
      logger.info("No microfrontends found in values file. Skipping removal.");
      return;
    }

    const workspaceFilePath = path.join(importsDirectory, `onecx_admin.json`);
    const workspaceFile = fs.readFileSync(workspaceFilePath, "utf8");
    const workspace = JSON.parse(workspaceFile);

    let existingProducts = workspace.workspaces.admin.products;
    // Remove product if it exists
    existingProducts = existingProducts.filter(
      (product: any) => product.productName !== input.productName
    );

    workspace.workspaces.admin.products = existingProducts;

    if (dryRun) {
      logger.info(
        `Dry Run: Would write to ${workspaceFilePath} with content:`,
        JSON.stringify(workspace, null, 2)
      );
    } else {
      fs.writeFileSync(workspaceFilePath, JSON.stringify(workspace, null, 2));
    }

    logger.info("Workspace entries removed successfully.");
  }
}
