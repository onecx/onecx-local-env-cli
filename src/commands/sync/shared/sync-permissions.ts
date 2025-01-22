import fs from "fs";
import path from "path";
import {
  SynchronizationStep,
  SynchronizationStepOptions,
} from "../../../util/synchronization-step";
import { getImportsDirectory, logger } from "../../../util/utils";
import { SharedData } from "./shared-data";

export interface SyncPermissionsParameters extends SharedData {
  customName: string;
  roleName: string;
}

export class SyncPermissions
  implements SynchronizationStep<SyncPermissionsParameters>
{
  synchronize(
    values: any,
    parameters: SyncPermissionsParameters,
    { dry: dryRun, env }: SynchronizationStepOptions
  ): void {
    let importsDir = getImportsDirectory("./imports/permissions", env);

    if (
      !values.app ||
      !values.app.operator ||
      !values.app.operator.permission ||
      !values.app.operator.permission.spec ||
      !values.app.operator.permission.spec.permissions ||
      Object.keys(values.app.operator.permission.spec.permissions).length === 0
    ) {
      logger.info(
        "No permissions found in values file. Skipping synchronization."
      );
      return;
    }
    const fileName = `${parameters.productName}_${parameters.customName}.json`;
    const filePath = path.join(importsDir, fileName);

    const permissionFile: {
      name: string;
      permissions: { resource: string; action: string }[];
    } = { name: parameters.customName, permissions: [] };

    // Build permissions array
    for (const [resource, uiPermissions] of Object.entries(
      values.app.operator.permission.spec.permissions
    ) as [string, any][]) {
      permissionFile.permissions.push(
        ...Object.keys(uiPermissions).map((action: string) => ({
          resource,
          action,
        }))
      );
    }

    if (dryRun) {
      logger.info(
        `Dry Run: Would write to ${filePath} with content:`,
        JSON.stringify(permissionFile, null, 2)
      );
    } else {
      fs.writeFileSync(filePath, JSON.stringify(permissionFile, null, 2));
    }

    // Sync assignments
    let assignmentsDir = getImportsDirectory("./imports/assignments", env);
    const assignmentsFilePath = path.join(assignmentsDir, "onecx.json");

    if (!fs.existsSync(assignmentsFilePath)) {
      throw new Error(
        `Assignments file not found at path: ${assignmentsFilePath}`
      );
    }

    const assignmentsFile = fs.readFileSync(assignmentsFilePath, "utf8");
    const assignments = JSON.parse(assignmentsFile);

    // Section for product in assignments
    if (!assignments.assignments[parameters.productName]) {
      assignments.assignments[parameters.productName] = {};
    }
    const productSection = assignments.assignments[parameters.productName];
    // Section for UI in product section
    if (!productSection[parameters.customName]) {
      productSection[parameters.customName] = {};
    }
    const uiSection = productSection[parameters.customName];
    // Target role
    const targetRole = parameters.roleName;
    // Clear & Set permissions
    uiSection[targetRole] = {};
    for (const [resource, uiPermissions] of Object.entries(
      values.app.operator.permission.spec.permissions
    ) as [string, any][]) {
      uiSection[targetRole][resource] = Object.keys(uiPermissions);
    }

    if (dryRun) {
      logger.info(
        `Dry Run: Would write to ${assignmentsFilePath} with content:`,
        JSON.stringify(assignments, null, 2)
      );
    } else {
      fs.writeFileSync(
        assignmentsFilePath,
        JSON.stringify(assignments, null, 2)
      );
    }

    logger.info("Permissions synchronized successfully.");
  }

  removeSynchronization(
    values: any,
    input: SyncPermissionsParameters,
    options: SynchronizationStepOptions
  ): void {
    let importsDir = getImportsDirectory("./imports/permissions", options.env);
    const fileName = `${input.productName}_${input.customName}.json`;
    const filePath = path.join(importsDir, fileName);

    if (fs.existsSync(filePath)) {
      if (options.dry) {
        logger.info(`Dry Run: Would remove file at ${filePath}`);
      } else {
        fs.unlinkSync(filePath);
        logger.info(`Removed file at ${filePath}`);
      }
    } else {
      logger.info(`File not found at ${filePath}, nothing to remove.`);
    }

    // Remove assignments
    let assignmentsDir = getImportsDirectory(
      "./imports/assignments",
      options.env
    );
    const assignmentsFilePath = path.join(assignmentsDir, "onecx.json");

    if (!fs.existsSync(assignmentsFilePath)) {
      throw new Error(
        `Assignments file not found at path: ${assignmentsFilePath}`
      );
    }

    const assignmentsFile = fs.readFileSync(assignmentsFilePath, "utf8");
    const assignments = JSON.parse(assignmentsFile);

    if (
      assignments.assignments[input.productName] &&
      assignments.assignments[input.productName][input.customName] &&
      assignments.assignments[input.productName][input.customName][
        input.roleName
      ]
    ) {
      if (options.dry) {
        logger.info(
          `Dry Run: Would remove assignments for role ${input.roleName} in UI ${input.customName} for product ${input.productName}`
        );
      } else {
        delete assignments.assignments[input.productName][input.customName][
          input.roleName
        ];
        fs.writeFileSync(
          assignmentsFilePath,
          JSON.stringify(assignments, null, 2)
        );
        logger.info(
          `Removed assignments for role ${input.roleName} in UI ${input.customName} for product ${input.productName}`
        );
      }
    } else {
      logger.info(
        `Assignments for role ${input.roleName} in UI ${input.customName} for product ${input.productName} not found, nothing to remove.`
      );
    }

    logger.info("Permissions removal completed successfully.");
  }
}
