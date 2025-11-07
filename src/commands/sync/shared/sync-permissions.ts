import { red } from "colors/safe";
import fs from "fs";
import path from "path";
import { SynchronizationStep } from "../../../util/synchronization-step";
import { getEnvDirectory, logger } from "../../../util/utils";
import { SharedSyncData } from "../sync-command";
import { OneCXValuesSpecification } from "../types";

export interface SyncPermissionsParams extends SharedSyncData {
  appName: string;
  roleName: string;
  assignmentsFilePrefix?: string;
}

export class SyncPermissions
  implements SynchronizationStep<SyncPermissionsParams>
{
  synchronize(
    values: OneCXValuesSpecification,
    { env, dry, ...params }: SyncPermissionsParams
  ): void {
    const importsDir = getEnvDirectory("./onecx-data/permissions", env);

    if (
      !values.operator?.permission?.spec?.permissions ||
      Object.keys(values.operator.permission.spec.permissions).length === 0
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
      values.operator.permission.spec.permissions
    )) {
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
    const assignmentsDir = getEnvDirectory("./onecx-data/assignments", env);
    const assignmentsFilePath = getAssignmentsFilePath(
      assignmentsDir,
      params.assignmentsFilePrefix ?? "",
      params.productName
    );

    let assignments;
    if (!fs.existsSync(assignmentsFilePath)) {
      // Create new assignments structure and file
      assignments = {
        id: `${params.assignmentsFilePrefix}-import-assignments-${params.productName}`,
        assignments: {},
      };
      fs.writeFileSync(
        assignmentsFilePath,
        JSON.stringify(assignments, null, 2)
      );
      logger.info(
        `Created new assignments file at path: ${assignmentsFilePath}`
      );
    } else {
      const assignmentsFile = fs.readFileSync(assignmentsFilePath, "utf8");
      assignments = JSON.parse(assignmentsFile);
    }

    // Section for product in assignments
    assignments.assignments[params.productName] ??= {};
    const productSection = assignments.assignments[params.productName];
    // Section for UI in product section
    productSection[params.appName] ??= {};
    const uiSection = productSection[params.appName];
    // Target role
    const targetRole = params.roleName;
    // Clear & Set permissions
    uiSection[targetRole] = {};
    for (const [resource, uiPermissions] of Object.entries(
      values.operator.permission.spec.permissions
    )) {
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
    _: OneCXValuesSpecification,
    { env, dry, ...params }: SyncPermissionsParams
  ): void {
    const importsDir = getEnvDirectory("./onecx-data/permissions", env);
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
    const assignmentsDir = getEnvDirectory("./onecx-data/assignments", env);
    const assignmentsFilePath = getAssignmentsFilePath(
      assignmentsDir,
      params.assignmentsFilePrefix ?? "",
      params.productName
    );

    if (!fs.existsSync(assignmentsFilePath)) {
      throw new Error(
        `Assignments file not found at path: ${assignmentsFilePath}`
      );
    }

    const assignmentsFile = fs.readFileSync(assignmentsFilePath, "utf8");
    const assignments = JSON.parse(assignmentsFile);

    if (
      assignments.assignments?.[params.productName]?.[params.appName]?.[
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

function getAssignmentsFilePath(
  assignmentsDir: string,
  prefix: string,
  productName: string
): string {
  return prefix
    ? path.join(assignmentsDir, `${prefix}_${productName}.json`)
    : path.join(assignmentsDir, "onecx.json");
}
