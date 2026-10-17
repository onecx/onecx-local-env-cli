import fs from "fs";
import os from "os";
import path from "path";
import { OneCXValuesSpecification } from "../types";
import {
  SyncWorkspace,
  SyncWorkspacesParameters,
} from "./sync-workspace";

describe("SyncWorkspace", () => {
  const values: OneCXValuesSpecification = {
    image: {
      repository: "onecx-mock",
    },
    operator: {
      microfrontend: {
        specs: {
          "shell-toast": {
            remoteName: "onecx-shell",
            name: "shell-toast",
            description: "Display shell toast notifications",
            exposedModule: "./OneCXShellToastComponent",
            note: "Imported MFE",
            technology: "WEBCOMPONENTMODULE",
            tagName: "ocx-shell-toast-component",
            type: "COMPONENT",
          },
          "shell-toast-custom": {
            remoteName: "onecx-shell",
            name: "shell-toast-custom",
            description: "Display shell toast notifications",
            exposedModule: "./OneCXShellToastComponent",
            note: "Imported MFE",
            technology: "WEBCOMPONENTMODULE",
            tagName: "ocx-shell-toast-component",
            type: "COMPONENT",
          },
        },
      },
      slot: {
        specs: {},
      },
      permission: {
        spec: {
          permissions: {},
        },
      },
    },
  };

  const params: SyncWorkspacesParameters = {
    productName: "test",
    pathToValues: "path",
    basePath: "base",
    env: "dev",
    role: "role",
    icon: "icon",
    dry: false,
    remove: false,
    verbose: false,
    onecxSectionPath: "app",
    uiName: "onecx-mock",
    workspaceName: "ADMIN",
  };

  function setupWorkspaceFile(): string {
    const envDir = fs.mkdtempSync(path.join(os.tmpdir(), "sync-workspace-"));
    const workspaceDir = path.join(envDir, "onecx-data", "workspace");
    fs.mkdirSync(workspaceDir, { recursive: true });
    const workspaceFilePath = path.join(workspaceDir, "workspace.json");
    fs.writeFileSync(
      workspaceFilePath,
      JSON.stringify(
        {
          workspaces: {
            ADMIN: {
              products: [
                {
                  productName: "test",
                  baseUrl: "base",
                  microfrontends: [],
                },
              ],
            },
          },
        },
        null,
        2,
      ),
    );
    return envDir;
  }

  test("adds one microfrontend entry with appId equal to uiName", () => {
    const envDir = setupWorkspaceFile();
    try {
      const paramsWithEnv: SyncWorkspacesParameters = {
        ...params,
        env: envDir,
      };

      new SyncWorkspace().synchronize(values, paramsWithEnv);

      const workspace = JSON.parse(
        fs.readFileSync(
          path.join(envDir, "onecx-data", "workspace", "workspace.json"),
          "utf8",
        ),
      );
      const product = workspace.workspaces.ADMIN.products.find(
        (p: { productName: string }) => p.productName === "test",
      );

      // All microfrontends of one UI share the same appId, so there is
      // exactly one entry, even though the values contain multiple specs
      expect(product.microfrontends).toEqual([
        {
          appId: "onecx-mock",
          basePath: "/",
        },
      ]);
      expect(product.microfrontends[0].appId).toBe(paramsWithEnv.uiName);
    } finally {
      fs.rmSync(envDir, { recursive: true, force: true });
    }
  });
});
