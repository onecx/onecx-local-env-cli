import { SyncUICommand, SyncUIData } from "./sync-ui";
import fs from "fs";
import yaml from "js-yaml";
import path from "path";
import { SyncMicrofrontends } from "./sync-microfrontends";
import { SyncPermissions } from "../shared/sync-permissions";
import { SyncMicroservices } from "../shared/sync-microservices";
import { SyncProducts } from "../shared/sync-products";
import { SyncSlots } from "./sync-slots";
import { SyncWorkspace } from "./sync-workspace";

describe("Sync UI Command", () => {
  let cmd: SyncUICommand;

  const defaultData: SyncUIData = {
    productName: "test",
    pathToValues: "path",
    basePath: "base",
    env: "dev",
    role: "role",
    icon: "icon",
    dry: false,
    remove: false,
    verbose: false,
  };

  const mockValues = {
    app: {
      image: {
        repository: "onecx-mock",
      },
    },
  };

  beforeEach(() => {
    cmd = new SyncUICommand();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("should not continue if", () => {
    test("values not found", () => {
      expect(() => cmd.run(defaultData)).toThrow(
        "Values file not found at path: path"
      );
    });

    test("name not set and no repository", () => {
      let mockExistsSync = jest.spyOn(fs, "existsSync").mockReturnValue(true);
      let mockReadFileSync = jest.spyOn(fs, "readFileSync").mockReturnValue("");
      let mockLoad = jest.spyOn(yaml, "load").mockReturnValue({});

      expect(() => cmd.run(defaultData)).toThrow(
        "No repository found in values file and no custom name provided."
      );

      expect(mockExistsSync).toHaveBeenCalledWith("path");
      expect(mockReadFileSync).toHaveBeenCalledWith("path", "utf8");
      expect(mockLoad).toHaveBeenCalledWith("");
    });

    test("imports directory does not exist", () => {
      jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
      jest.spyOn(fs, "readFileSync").mockReturnValue("");
      jest
        .spyOn(path, "resolve")
        .mockImplementation((...args) => "path/" + args.pop());
      jest.spyOn(yaml, "load").mockReturnValue(mockValues);

      expect(() => cmd.run(defaultData)).toThrow(
        new RegExp("Imports directory not found at path:(.*)")
      );
    });
  });

  describe("should call", () => {
    beforeEach(() => {
      jest.spyOn(fs, "existsSync").mockReturnValue(true);
      jest.spyOn(fs, "readFileSync").mockReturnValue("");
      jest
        .spyOn(path, "resolve")
        .mockImplementation((...args) => "path/" + args.pop());
      jest.spyOn(yaml, "load").mockReturnValue(mockValues);
      jest.spyOn(fs, "writeFileSync").mockReturnValue();
    });

    test("synchronize for microfrontends", () => {
      let mockSyncMicrofrontends = jest
        .spyOn(SyncMicrofrontends.prototype, "synchronize")
        .mockReturnValue();
      try {
        cmd.run(defaultData);
      } catch (e) {
        console.error(e);
      }

      expect(mockSyncMicrofrontends).toHaveBeenCalledWith(mockValues, {
        ...defaultData,
        uiName: "onecx-mock",
      });
    });

    test("synchronize for permissions", () => {
      let mockSyncPermissions = jest
        .spyOn(SyncPermissions.prototype, "synchronize")
        .mockReturnValue();
      try {
        cmd.run(defaultData);
      } catch (e) {}

      expect(mockSyncPermissions).toHaveBeenCalledWith(mockValues, {
        ...defaultData,
        appName: "onecx-mock",
        roleName: "role",
      });
    });

    test("synchronize for microservices", () => {
      let mockSyncMicroservices = jest
        .spyOn(SyncMicroservices.prototype, "synchronize")
        .mockReturnValue();
      try {
        cmd.run(defaultData);
      } catch (e) {}

      expect(mockSyncMicroservices).toHaveBeenCalledWith(mockValues, {
        ...defaultData,
        customName: "onecx-mock",
      });
    });

    test("synchronize for products", () => {
      let mockSyncProducts = jest
        .spyOn(SyncProducts.prototype, "synchronize")
        .mockReturnValue();
      try {
        cmd.run(defaultData);
      } catch (e) {}

      expect(mockSyncProducts).toHaveBeenCalledWith(mockValues, {
        ...defaultData,
        icon: "icon",
      });
    });

    test("synchronize for slots", () => {
      let mockSyncSlots = jest
        .spyOn(SyncSlots.prototype, "synchronize")
        .mockReturnValue();
      try {
        cmd.run(defaultData);
      } catch (e) {}

      expect(mockSyncSlots).toHaveBeenCalledWith(mockValues, {
        ...defaultData,
        uiName: "onecx-mock",
      });
    });

    test("synchronize for workspace", () => {
      let mockSyncWorkspace = jest
        .spyOn(SyncWorkspace.prototype, "synchronize")
        .mockReturnValue();
      try {
        cmd.run(defaultData);
      } catch (e) {}

      expect(mockSyncWorkspace).toHaveBeenCalledWith(mockValues, {
        ...defaultData,
        uiName: "onecx-mock",
      });
    });
  });
});
