import fs from "fs";
import path from "path";
import { SynchronizationStep } from "../../../util/synchronization-step";
import { getEnvDirectory, logger } from "../../../util/utils";
import { SyncUIData } from "./sync-ui";
import {
  ProductMicrofrontendSpecification,
  ProductSpecification,
  OneCXValuesSpecification,
} from "../types";

export interface SyncWorkspacesParameters extends SyncUIData {
  uiName: string;
  workspaceName?: string;
}

export class SyncWorkspace
  implements SynchronizationStep<SyncWorkspacesParameters>
{
  synchronize(
    values: OneCXValuesSpecification,
    { env, dry, ...params }: SyncWorkspacesParameters
  ): void {
    const importsDirectory = getEnvDirectory("./onecx-data/workspace/", env);

    if (!values.operator?.microfrontend) {
      logger.info(
        "No microfrontends found in values file. Skipping synchronization."
      );
      return;
    }

    const workspaceName = params.workspaceName ?? "admin";
    const workspaceAndProducts = findWorkspaceAndProducts(
      importsDirectory,
      workspaceName
    );
    const { workspaceFilePath, workspace, workspaceNameKey } =
      workspaceAndProducts;
    let existingProducts = workspaceAndProducts.existingProducts;

    if (!workspaceNameKey || !workspaceFilePath || !existingProducts) {
      logger.info(
        `Workspace "${workspaceName}" not found in any file. Skipping synchronization.`
      );
      return;
    }

    // Check if product exists
    const existingProduct = existingProducts.find(
      (product: ProductSpecification) =>
        product.productName == params.productName
    );

    if (existingProduct) {
      logger.verbose("Found existing product: ", existingProduct);
    }

    // Create new product
    const product: {
      productName: string;
      baseUrl: string;
      microfrontends: { appId: string; basePath: string }[];
    } = existingProduct ?? {
      productName: params.productName,
      baseUrl: params.basePath,
      microfrontends: [],
    };

    const microfrontends = values.operator.microfrontend.specs;

    if (product.microfrontends.length > 0) {
      logger.verbose(
        "Found existing microfrontends in product: ",
        product.microfrontends
      );
    }

    // TODO: key/spec not used at all => fix
    for (const [_, spec] of Object.entries(microfrontends) as [
      string,
      {
        remoteName: string;
      }
    ][]) {
      const microfrontend = {
        appId: spec.remoteName,
        basePath: "/",
      };

      const existingMicrofrontend = product.microfrontends.find(
        (mf: ProductMicrofrontendSpecification) =>
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
      existingProducts = existingProducts.map(
        (_product: ProductSpecification) =>
          _product.productName === product.productName ? product : _product
      );
    } else {
      existingProducts.push(product);
    }

    workspace.workspaces[workspaceNameKey].products = existingProducts;

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
    values: OneCXValuesSpecification,
    { env, dry, ...params }: SyncWorkspacesParameters
  ): void {
    const importsDirectory = getEnvDirectory("./onecx-data/workspace/", env);

    if (!values.operator?.microfrontend) {
      logger.info("No microfrontends found in values file. Skipping removal.");
      return;
    }

    const workspaceName = params.workspaceName ?? "admin";
    const workspaceAndProducts = findWorkspaceAndProducts(
      importsDirectory,
      workspaceName
    );
    const { workspaceFilePath, workspace, workspaceNameKey } =
      workspaceAndProducts;
    let existingProducts = workspaceAndProducts.existingProducts;

    if (!workspaceNameKey || !workspaceFilePath || !existingProducts) {
      logger.info(
        `Workspace "${workspaceName}" not found in any file. Skipping removal.`
      );
      return;
    }

    // Remove product if it exists
    existingProducts = existingProducts.filter(
      (product: ProductSpecification) =>
        product.productName !== params.productName
    );

    workspace.workspaces[workspaceNameKey].products = existingProducts;

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

/**
 * Searches for a workspace JSON file in the given directory that matches the specified workspace name.
 * Returns the file path, parsed workspace object, products array, and workspace key if found.
 *
 * The function looks for a workspace either by key or by the 'name' property within each workspace entry.
 *
 * @param importsDirectory - The directory containing workspace JSON files.
 * @param workspaceName - The name of the workspace to search for.
 * @returns An object containing:
 *   - workspaceFilePath: The path to the matching workspace file (if found).
 *   - workspace: The parsed workspace JSON object (if found).
 *   - existingProducts: The array of products for the matched workspace (if found).
 *   - workspaceNameKey: The key of the matched workspace (if found).
 *   If no match is found, returns an empty object.
 */
function findWorkspaceAndProducts(
  importsDirectory: string,
  workspaceName: string
): {
  workspaceFilePath?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workspace?: any;
  existingProducts?: ProductSpecification[];
  workspaceNameKey?: string;
} {
  const workspaceFiles = fs
    .readdirSync(importsDirectory)
    .filter((f) => f.endsWith(".json"));
  for (const file of workspaceFiles) {
    const filePath = path.join(importsDirectory, file);
    const fileContent = fs.readFileSync(filePath, "utf8");
    const workspaceJson = JSON.parse(fileContent);

    for (const [key, value] of Object.entries(workspaceJson.workspaces)) {
      if (key === workspaceName) {
        return {
          workspaceFilePath: filePath,
          workspace: workspaceJson,
          existingProducts: workspaceJson.workspaces[key].products,
          workspaceNameKey: key,
        };
      }
      if ((value as { name: string }).name === workspaceName) {
        return {
          workspaceFilePath: filePath,
          workspace: workspaceJson,
          existingProducts: (value as { products: ProductSpecification[] })
            .products,
          workspaceNameKey: (value as { name: string }).name,
        };
      }
    }
  }
  return {};
}
