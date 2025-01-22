import fs from "fs";
import path from "path";
import {
  SynchronizationStep,
  SynchronizationStepOptions,
} from "../../../util/synchronization-step";
import { getImportsDirectory, logger } from "../../../util/utils";
import { SyncUIData } from "./sync-ui";

export interface SyncMicrofrontendsParameters extends SyncUIData {
  uiName: string;
}

export class SyncMicrofrontends
  implements SynchronizationStep<SyncMicrofrontendsParameters>
{
  synchronize(
    values: any,
    parameters: SyncMicrofrontendsParameters,
    { dry: dryRun, env }: SynchronizationStepOptions
  ): void {
    let importsDirectory = getImportsDirectory(
      "./imports/product-store/microfrontends",
      env
    );

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

    const microfrontends = values.app.operator.microfrontend.specs;

    for (const [key, spec] of Object.entries(microfrontends) as [
      string,
      any
    ][]) {
      const fileName = `${parameters.productName}_${parameters.uiName}-${key}.json`;
      const filePath = path.join(importsDirectory, fileName);

      const jsonContent = {
        appVersion: "xxx",
        appName: spec.remoteName,
        description: spec.description,
        remoteBaseUrl: `/mfe/${spec.remoteName}/`,
        remoteEntry: `/mfe/${spec.remoteName}/remoteEntry.js`,
        note: spec.note || "Imported MFE",
        exposedModule: spec.exposedModule,
        technology: spec.technology,
        remoteName: spec.remoteName,
        tagName: spec.tagName,
        type: spec.type,
        deprecated: false,
        undeployed: false,
      };

      if (dryRun) {
        logger.info(
          `Dry Run: Would write to ${filePath} with content:`,
          JSON.stringify(jsonContent, null, 2)
        );
      } else {
        fs.writeFileSync(filePath, JSON.stringify(jsonContent, null, 2));
      }
    }

    logger.info("Microfrontends synchronized successfully.");
  }

  removeSynchronization(
    values: any,
    input: SyncMicrofrontendsParameters,
    options: SynchronizationStepOptions
  ): void {
    let importsDirectory = getImportsDirectory(
      "./imports/product-store/microfrontends",
      options.env
    );

    if (
      !values.app ||
      !values.app.operator ||
      !values.app.operator.microfrontend
    ) {
      logger.info("No microfrontends found in values file. Skipping removal.");
      return;
    }

    const microfrontends = values.app.operator.microfrontend.specs;

    for (const key of Object.keys(microfrontends)) {
      const fileName = `${input.productName}_${input.uiName}_${key}.json`;
      const filePath = path.join(importsDirectory, fileName);

      if (fs.existsSync(filePath)) {
        if (options.dry) {
          logger.info(`Dry Run: Would remove ${filePath}`);
        } else {
          fs.unlinkSync(filePath);
        }
      } else {
        logger.info(`File ${filePath} does not exist. Skipping.`);
      }
    }

    logger.info("Microfrontends removal completed successfully.");
  }
}
