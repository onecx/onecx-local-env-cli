import fs from "fs";
import path from "path";
import { getImportsDirectory, logger } from "../../util/utils";
import { OnecxCommand } from "../onecx-command";

export interface ManageMenuEntryData {
  operation: "create" | "remove";
  url: string;
  name: string;
  appId: string;
  badge: string;
}

export class ManageMenuEntryCommand
  implements OnecxCommand<ManageMenuEntryData>
{
  run(data: ManageMenuEntryData, options: { [key: string]: string }): void {
    logger.info("Creating menu entry...");

    // Validate imports directory exists
    let importsDirectory = getImportsDirectory(
      "./imports/workspace",
      options.env
    );
    if (!fs.existsSync(importsDirectory)) {
      throw new Error(
        `Imports directory not found at path: ${importsDirectory}`
      );
    }

    const workspaceFilePath = path.join(importsDirectory, `onecx_admin.json`);
    const workspaceFile = fs.readFileSync(workspaceFilePath, "utf8");
    const workspace = JSON.parse(workspaceFile);
    const menuItems = workspace.workspaces.admin.menuItems;
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
      data.badge
    );
    if (!myAppsMenuEntry && data.operation === "create") {
      CustomApplicationMenuEntry.children.push(newEntry);
      portalMainMenu.children.push(CustomApplicationMenuEntry);
    } else {
      let menuItemsWithoutNew = myAppsMenuEntry.children.filter(
        (menuItem: any) => menuItem.key !== newEntry.key
      );
      if (data.operation === "create") {
        menuItemsWithoutNew.push(newEntry);
      }
      myAppsMenuEntry.children = menuItemsWithoutNew;
    }

    workspace.workspaces.admin.menuItems = menuItems;
    if (options.dry) {
      logger.info(
        `Dry Run: Would write to ${workspaceFilePath} with content:`,
        JSON.stringify(workspace, null, 2)
      );
    } else {
      fs.writeFileSync(workspaceFilePath, JSON.stringify(workspace, null, 2));
    }

    if (data.operation === "create") {
      logger.info("Menu entry created successfully.");
    } else {
      logger.info("Menu entry removed successfully.");
    }
  }
}

function createMenuEntryForApplication(
  url: string,
  name: string,
  appId: string,
  badge: string
): MenuEntry {
  return {
    key: `CUSTOM_${appId.toUpperCase().replace(/(-| )/g, "_")}`,
    name,
    url,
    applicationId: appId,
    disabled: false,
    position: 0,
    badge,
    external: false,
    i18n: {
      en: name,
      de: name,
    },
    roles: ["onecx-admin"],
    children: [],
  };
}

const CustomApplicationMenuEntry: MenuEntry = {
  key: "CORE_CUSTOM_APP",
  name: "Custom Applications",
  url: "",
  disabled: false,
  position: 0,
  badge: "folder",
  external: false,
  i18n: {
    en: "Custom Applications",
    de: "Custom Applications",
  },
  roles: ["onecx-admin"],
  children: [],
};

interface MenuEntry {
  key: string;
  name: string;
  url: string;
  applicationId?: string;
  disabled: boolean;
  position: number;
  badge: string;
  external: boolean;
  i18n: {
    en: string;
    de: string;
  };
  roles: string[];
  children: MenuEntry[];
}
