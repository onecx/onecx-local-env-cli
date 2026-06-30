import fs from "fs";
import { OneCXValuesSpecification } from "../types";
import {
  SyncMicrofrontends,
  SyncMicrofrontendsparams,
} from "./sync-microfrontends";

type MicrofrontendOperator = NonNullable<
  OneCXValuesSpecification["operator"]
>["microfrontend"];

describe("SyncMicrofrontends", () => {
  const defaultParams: SyncMicrofrontendsparams = {
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
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  function createValues(
    microfrontend: MicrofrontendOperator,
  ): OneCXValuesSpecification {
    return {
      image: {
        repository: "onecx-mock",
      },
      routing: {
        path: "/newShell/",
      },
      operator: {
        microfrontend,
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
  }

  describe("operator values", () => {
    test("uses entrySuffix from microfrontend spec before operator default", () => {
      const writeFileSyncMock = jest
        .spyOn(fs, "writeFileSync")
        .mockReturnValue();

      new SyncMicrofrontends().synchronize(
        createValues({
          entrySuffix: "mf-manifest.json",
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
              entrySuffix: "custom-manifest.json",
            },
          },
        }),
        defaultParams,
      );

      expect(writeFileSyncMock).toHaveBeenCalledWith(
        expect.stringContaining("test_onecx-shell_shell-toast.json"),
        expect.any(String),
      );
      expect(JSON.parse(String(writeFileSyncMock.mock.calls[0]?.[1]))).toEqual(
        expect.objectContaining({
          remoteEntry: "/newShell/custom-manifest.json",
        }),
      );
    });

    test("uses shareScope from microfrontend spec before operator default", () => {
      const writeFileSyncMock = jest
        .spyOn(fs, "writeFileSync")
        .mockReturnValue();

      new SyncMicrofrontends().synchronize(
        createValues({
          spec: {
            shareScope: "angular_21",
          },
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
              shareScope: "angular_22",
            },
          },
        }),
        defaultParams,
      );

      expect(writeFileSyncMock).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("test_onecx-shell_shell-toast.json"),
        expect.any(String),
      );
      expect(JSON.parse(String(writeFileSyncMock.mock.calls[0]?.[1]))).toEqual(
        expect.objectContaining({
          shareScope: "angular_21",
        }),
      );

      expect(writeFileSyncMock).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("test_onecx-shell_shell-toast-custom.json"),
        expect.any(String),
      );
      expect(JSON.parse(String(writeFileSyncMock.mock.calls[1]?.[1]))).toEqual(
        expect.objectContaining({
          shareScope: "angular_22",
        }),
      );
    });
  });
});
