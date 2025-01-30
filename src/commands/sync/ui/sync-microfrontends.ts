import fs from "fs";
import path from "path";
import { SynchronizationStep } from "../../../util/synchronization-step";
import { getEnvDirectory, logger } from "../../../util/utils";
import { SyncUIData } from "./sync-ui";

export interface SyncMicrofrontendsparams extends SyncUIData {
  uiName: string;
}

export class SyncMicrofrontends
  implements SynchronizationStep<SyncMicrofrontendsparams>
{
  synchronize(
    values: any,
    { env, dry, ...params }: SyncMicrofrontendsparams
  ): void {
    let importsDirectory = getEnvDirectory(
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
      const fileName = `${params.productName}_${params.uiName}_${key}.json`;
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

      for (let requiredField of [
        "remoteName",
        "remoteEntry",
        "exposedModule",
        "tagName",
        "type",
      ]) {
        if (!spec[requiredField]) {
          logger.warning(
            `Missing field ${requiredField} in microfrontend spec ${key}, this can cause issues.`
          );
        }
      }

      if (dry) {
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
    { env, dry, ...params }: SyncMicrofrontendsparams
  ): void {
    let importsDirectory = getEnvDirectory(
      "./imports/product-store/microfrontends",
      env
    );

    if (
      !values.app ||
      !values.app.operator ||
      !values.app.operator.microfrontend
    ) {
      logger.info("No microfrontends found in values file. Skipping.");
      return;
    }

    const microfrontends = values.app.operator.microfrontend.specs;

    for (const key of Object.keys(microfrontends)) {
      const fileName = `${params.productName}_${params.uiName}_${key}.json`;
      const filePath = path.join(importsDirectory, fileName);

      if (fs.existsSync(filePath)) {
        if (dry) {
          logger.info(`Dry Run: Would remove ${filePath}`);
        } else {
          fs.unlinkSync(filePath);
        }
      }
    }

    logger.info("Microfrontends removed successfully.");
  }
}
