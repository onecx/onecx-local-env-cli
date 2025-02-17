import { red } from "colors/safe";
import fs from "fs";
import path from "path";
import { SynchronizationStep } from "../../../util/synchronization-step";
import { getEnvDirectory, logger } from "../../../util/utils";
import { SharedSyncData } from "../sync-command";
import { ValuesSpecification } from "../types";

export interface SyncPermissionsParams extends SharedSyncData {
  appName: string;
  roleName: string;
}

export class SyncPermissions
  implements SynchronizationStep<SyncPermissionsParams>
{
  synchronize(
    values: ValuesSpecification,
    { env, dry, ...params }: SyncPermissionsParams
  ): void {
    const importsDir = getEnvDirectory("./imports/permissions", env);

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
    const fileName = `${params.productName}_${params.appName}.json`;
    const filePath = path.join(importsDir, fileName);

    const permissionFile: {
      name: string;
      permissions: { resource: string; action: string }[];
    } = { name: params.appName, permissions: [] };

    // Build permissions array
    for (const [resource, uiPermissions] of Object.entries(
      values.app.operator.permission.spec.permissions
    ) as [string, { [key: string]: string }][]) {
      permissionFile.permissions.push(
        ...Object.keys(uiPermissions).map((action: string) => ({
          resource,
          action,
        }))
      );
    }

    if (dry) {
      logger.info(
        `Dry Run: Would write to ${filePath} with content:`,
        JSON.stringify(permissionFile, null, 2)
      );
    } else {
      fs.writeFileSync(filePath, JSON.stringify(permissionFile, null, 2));
    }

    // Sync assignments
    const assignmentsDir = getEnvDirectory("./imports/assignments", env);
    const assignmentsFilePath = path.join(assignmentsDir, "onecx.json");

    if (!fs.existsSync(assignmentsFilePath)) {
      throw new Error(
        `Assignments file not found at path: ${assignmentsFilePath}`
      );
    }

    const assignmentsFile = fs.readFileSync(assignmentsFilePath, "utf8");
    const assignments = JSON.parse(assignmentsFile);

    // Section for product in assignments
    if (!assignments.assignments[params.productName]) {
      assignments.assignments[params.productName] = {};
    }
    const productSection = assignments.assignments[params.productName];
    // Section for UI in product section
    if (!productSection[params.appName]) {
      productSection[params.appName] = {};
    }
    const uiSection = productSection[params.appName];
    // Target role
    const targetRole = params.roleName;
    // Clear & Set permissions
    uiSection[targetRole] = {};
    for (const [resource, uiPermissions] of Object.entries(
      values.app.operator.permission.spec.permissions
    ) as [string, { [key: string]: string }][]) {
      uiSection[targetRole][resource] = Object.keys(uiPermissions);
    }

    if (dry) {
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
    _: ValuesSpecification,
    { env, dry, ...params }: SyncPermissionsParams
  ): void {
    const importsDir = getEnvDirectory("./imports/permissions", env);
    const fileName = `${params.productName}_${params.appName}.json`;
    const filePath = path.join(importsDir, fileName);

    if (fs.existsSync(filePath)) {
      if (dry) {
        logger.info(`Dry Run: Would remove file at ${filePath}`);
      } else {
        fs.unlinkSync(filePath);
        logger.info(red(`- ${filePath}`));
      }
    }

    // Remove assignments
    const assignmentsDir = getEnvDirectory("./imports/assignments", env);
    const assignmentsFilePath = path.join(assignmentsDir, "onecx.json");

    if (!fs.existsSync(assignmentsFilePath)) {
      throw new Error(
        `Assignments file not found at path: ${assignmentsFilePath}`
      );
    }

    const assignmentsFile = fs.readFileSync(assignmentsFilePath, "utf8");
    const assignments = JSON.parse(assignmentsFile);

    if (
      assignments.assignments[params.productName] &&
      assignments.assignments[params.productName][params.appName] &&
      assignments.assignments[params.productName][params.appName][
        params.roleName
      ]
    ) {
      if (dry) {
        logger.info(
          `Dry Run: Would remove assignments for role ${params.roleName} in UI ${params.appName} for product ${params.productName}`
        );
      } else {
        // Delete assignments for role
        delete assignments.assignments[params.productName][params.appName][
          params.roleName
        ];
        // Cleanup empty sections
        if (
          Object.keys(
            assignments.assignments[params.productName][params.appName]
          ).length === 0
        ) {
          delete assignments.assignments[params.productName][params.appName];
        }
        if (
          Object.keys(assignments.assignments[params.productName]).length === 0
        ) {
          delete assignments.assignments[params.productName];
        }
        fs.writeFileSync(
          assignmentsFilePath,
          JSON.stringify(assignments, null, 2)
        );
      }
    }

    logger.info("Permissions removed successfully.");
  }
}
