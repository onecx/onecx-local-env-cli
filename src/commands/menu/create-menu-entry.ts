import fs from "fs";
import path from "path";
import { getEnvDirectory, logger } from "../../util/utils";
import { OnecxCommand } from "../onecx-command";

export interface CreateMenuEntryData {
  url: string;
  name: string;
  appId: string;
  badge: string;
  env: string;
  dry: boolean;
  workspace: string;
  roles: string[];
}

export class CreateMenuEntryCommand
  implements OnecxCommand<CreateMenuEntryData>
{
  run(data: CreateMenuEntryData): void {
    logger.info("Creating menu entry...");

    // Assure roles is an array
    data.roles = Array.isArray(data.roles) ? data.roles : [data.roles];

    // Validate imports directory exists
    const importsDirectory = getEnvDirectory("./onecx-data/workspace", data.env);
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
      (menuItem: { key: string }) => menuItem.key === "PORTAL_MAIN_MENU"
    );

    if (!portalMainMenu) {
      throw new Error("PORTAL_MAIN_MENU not found in workspace file.");
    }

    // Check if custom apps menu entry already exist
    const myAppsMenuEntry = portalMainMenu.children.find(
      (menuItem: { key: string }) => menuItem.key === "CORE_CUSTOM_APP"
    );

    const newEntry = createMenuEntryForApplication(
      data.url,
      data.name,
      data.appId,
      data.badge,
      data.roles
    );
    if (!myAppsMenuEntry) {
      const customEntry = getCustomApplicationMenuEntry(data.roles);
      customEntry.children.push(newEntry);
      portalMainMenu.children.push(customEntry);
    } else {
      const menuItemsWithoutNew = myAppsMenuEntry.children.filter(
        (menuItem: { key: string }) => menuItem.key !== newEntry.key
      );
      menuItemsWithoutNew.push(newEntry);
      myAppsMenuEntry.roles = data.roles;
      myAppsMenuEntry.children = menuItemsWithoutNew;
    }

    workspace.workspaces[data.workspace].menuItems = menuItems;
    if (data.dry) {
      logger.info(
        `Dry Run: Would write to ${workspaceFilePath} with content:`,
        JSON.stringify(workspace, null, 2)
      );
    } else {
      fs.writeFileSync(workspaceFilePath, JSON.stringify(workspace, null, 2));
    }

    logger.info("Menu entry created successfully.");
  }
}

export function createMenuEntryForApplication(
  url: string,
  name: string,
  appId: string,
  badge: string,
  roles: string[]
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
    roles,
    children: [],
  };
}

const getCustomApplicationMenuEntry = (roles: string[]): MenuEntry => ({
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
  roles: roles,
  children: [],
});

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
