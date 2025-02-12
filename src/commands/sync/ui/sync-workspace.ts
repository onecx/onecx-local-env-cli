import fs from "fs";
import path from "path";
import { SynchronizationStep } from "../../../util/synchronization-step";
import { getEnvDirectory, logger } from "../../../util/utils";
import { SyncUIData } from "./sync-ui";

export interface SyncWorkspacesParameters extends SyncUIData {
  uiName: string;
}

export class SyncWorkspace
  implements SynchronizationStep<SyncWorkspacesParameters>
{
  synchronize(
    values: any,
    { env, dry, ...params }: SyncWorkspacesParameters
  ): void {
    let importsDirectory = getEnvDirectory("./imports/workspace/", env);

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
    // Check if product exists
    let existingProduct = existingProducts.find(
      (product: any) => product.productName == params.productName
    );

    if (existingProduct) {
      logger.verbose("Found existing product: ", existingProduct);
    }

    // Create new product
    const product: {
      productName: string;
      baseUrl: string;
      microfrontends: { appId: any; basePath: string }[];
    } = existingProduct ?? {
      productName: params.productName,
      baseUrl: params.basePath,
      microfrontends: [],
    };

    const microfrontends = values.app.operator.microfrontend.specs;

    if (product.microfrontends.length > 0) {
      logger.verbose(
        "Found existing microfrontends in product: ",
        product.microfrontends
      );
    }

    for (const [key, spec] of Object.entries(microfrontends) as [
      string,
      any
    ][]) {
      const microfrontend = {
        appId: params.uiName,
        basePath: "/",
      };

      const existingMicrofrontend = product.microfrontends.find(
        (mf: any) =>
          mf.appId == microfrontend.appId &&
          mf.basePath == microfrontend.basePath
      );

      if (existingMicrofrontend === undefined) {
        product.microfrontends.push(microfrontend);
      } else {
        logger.info(
          `Microfrontend ${microfrontend.appId} with base path ${microfrontend.basePath} already exists. Skipping...`
        );
      }
    }

    if (existingProduct) {
      existingProducts = existingProducts.map((_product: any) =>
        _product.productName === product.productName ? product : _product
      );
    } else {
      existingProducts.push(product);
    }
    workspace.workspaces.admin.products = existingProducts;

    if (dry) {
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
    { env, dry, ...params }: SyncWorkspacesParameters
  ): void {
    let importsDirectory = getEnvDirectory("./imports/workspace/", env);

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
      (product: any) => product.productName !== params.productName
    );

    workspace.workspaces.admin.products = existingProducts;

    if (dry) {
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
