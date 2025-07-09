import fs from "fs";
import path from "path";
import { SynchronizationStep } from "../../../util/synchronization-step";
import { getEnvDirectory, logger } from "../../../util/utils";
import { OneCXValuesSpecification } from "../types";
import { SyncUIData } from "./sync-ui";

export interface SyncMicrofrontendsparams extends SyncUIData {
  uiName: string;
}

export class SyncMicrofrontends
  implements SynchronizationStep<SyncMicrofrontendsparams> {
  synchronize(
    values: OneCXValuesSpecification,
    { env, dry, ...params }: SyncMicrofrontendsparams
  ): void {
    const importsDirectory = getEnvDirectory(
      "./imports/product-store/microfrontends",
      env
    );

    if (
      !values?.operator?.microfrontend
    ) {
      logger.info(
        "No microfrontends found in values file. Skipping synchronization."
      );
      return;
    }

    const microfrontends = values.operator.microfrontend.specs;

    for (const [key, spec] of Object.entries(microfrontends)) {
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

      for (const requiredField of [
        "remoteName",
        "remoteEntry",
        "exposedModule",
        "tagName",
        "type",
      ]) {
        if (
          !Object.entries(spec).some(
            ([e, v]) => e === requiredField && v != null
          )
        ) {
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
    values: OneCXValuesSpecification,
    { env, dry, ...params }: SyncMicrofrontendsparams
  ): void {
    const importsDirectory = getEnvDirectory(
      "./imports/product-store/microfrontends",
      env
    );

    if (
      !values?.operator?.microfrontend
    ) {
      logger.info("No microfrontends found in values file. Skipping.");
      return;
    }

    const microfrontends = values.operator.microfrontend.specs;

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
