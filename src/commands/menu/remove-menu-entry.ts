import fs from "fs";
import path from "path";
import { getImportsDirectory, logger } from "../../util/utils";
import { OnecxCommand } from "../onecx-command";
import { createMenuEntryForApplication } from "./create-menu-entry";

export interface RemoveMenuEntryData {
  url: string;
  name: string;
  appId: string;
  badge: string;
  env: string;
  dry: boolean;
  workspace: string;
}

export class RemoveMenuEntryCommand
  implements OnecxCommand<RemoveMenuEntryData>
{
  run(data: RemoveMenuEntryData): void {
    logger.info("Removing menu entry...");
    // Validate imports directory exists
    let importsDirectory = getImportsDirectory("./imports/workspace", data.env);
    if (!fs.existsSync(importsDirectory)) {
      throw new Error(
        `Imports directory not found at path: ${importsDirectory}`
      );
    }

    const workspaceFilePath = path.join(
      importsDirectory,
      `onecx_${data.workspace}.json`
    );
    const workspaceFile = fs.readFileSync(workspaceFilePath, "utf8");
    const workspace = JSON.parse(workspaceFile);
    const menuItems = workspace.workspaces[data.workspace].menuItems;
    // Find PORTAL_MAIN_MENU
    const portalMainMenu = menuItems.find(
      (menuItem: any) => menuItem.key === "PORTAL_MAIN_MENU"
    );

    if (!portalMainMenu) {
      throw new Error("PORTAL_MAIN_MENU not found in workspace file.");
    }

    // Check if custom apps menu entry already exist
    const myAppsMenuEntry = portalMainMenu.children.find(
      (menuItem: any) => menuItem.key === "CORE_CUSTOM_APP"
    );

    const newEntry = createMenuEntryForApplication(
      data.url,
      data.name,
      data.appId,
      data.badge,
      []
    );
    let menuItemsWithoutNew = myAppsMenuEntry.children.filter(
      (menuItem: any) => menuItem.key !== newEntry.key
    );
    myAppsMenuEntry.children = menuItemsWithoutNew;

    workspace.workspaces[data.workspace].menuItems = menuItems;
    if (data.dry) {
      logger.info(
        `Dry Run: Would write to ${workspaceFilePath} with content:`,
        JSON.stringify(workspace, null, 2)
      );
    } else {
      fs.writeFileSync(workspaceFilePath, JSON.stringify(workspace, null, 2));
    }

    logger.info("Menu entry removed successfully.");
  }
}
