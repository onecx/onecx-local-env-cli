/* eslint-disable @typescript-eslint/no-unused-expressions */
import fs from "fs";
import { SyncMicroservices } from "../shared/sync-microservices";
import { SyncPermissions } from "../shared/sync-permissions";
import { SyncProducts } from "../shared/sync-products";
import * as valuesUtil from "../shared/values.utils";
import { ValuesSpecification } from "../types";
import { SyncMicrofrontends } from "./sync-microfrontends";
import { SyncSlots } from "./sync-slots";
import { SyncSVCCommand } from "./sync-svc";
import { SyncWorkspace } from "./sync-workspace";

describe("Sync SVC Command", () => {
  let cmd: SyncSVCCommand;

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

  const mockValues: ValuesSpecification = {
    app: {
      image: {
        repository: "onecx-mock",
      },
    },
  };

  beforeEach(() => {
    cmd = new SyncUICommand();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe("should not continue if", () => {
    test("values not found", () => {
      try {
        async () => await cmd.run(defaultData);
      } catch (e) {
        expect(e).toMatch("Values file not found at path: path");
      }
    });

    test("name not set and no repository", () => {
      jest.spyOn(valuesUtil, "retrieveValuesYAML").mockReturnValue(
        new Promise((r) => {
          r({});
        })
      );

      try {
        async () => await cmd.run(defaultData);
      } catch (e) {
        expect(e).toMatch(
          "No repository found in values file and no custom name provided."
        );
      }
    });

    test("imports directory does not exist", () => {
      jest.spyOn(valuesUtil, "retrieveValuesYAML").mockReturnValue(
        new Promise((r) => {
          r(mockValues);
        })
      );

      try {
        async () => await cmd.run(defaultData);
      } catch (e) {
        expect(e).toMatch(
          new RegExp("Imports directory not found at path:(.*)")
        );
      }
    });
  });

  describe("should call", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.restoreAllMocks();

      jest.spyOn(fs, "existsSync").mockReturnValue(true);
      jest.spyOn(fs, "writeFileSync").mockReturnValue();

      jest.spyOn(valuesUtil, "retrieveValuesYAML").mockReturnValue(
        new Promise((r) => {
          r(mockValues);
        })
      );
    });

    test("synchronize for microfrontends", async () => {
      const mockSyncMicrofrontends = jest
        .spyOn(SyncMicrofrontends.prototype, "synchronize")
        .mockReturnValue();

      try {
        await cmd.run(defaultData);
      } catch (e) {
        console.error(e);
      }

      expect(mockSyncMicrofrontends).toHaveBeenCalledWith(mockValues, {
        ...defaultData,
        uiName: "onecx-mock",
      });
    });

    test("synchronize for permissions", async () => {
      const mockSyncPermissions = jest
        .spyOn(SyncPermissions.prototype, "synchronize")
        .mockReturnValue();
      try {
        await cmd.run(defaultData);
      } catch (_e: unknown) {
        /* empty */
      }

      expect(mockSyncPermissions).toHaveBeenCalledWith(mockValues, {
        ...defaultData,
        appName: "onecx-mock",
        roleName: "role",
      });
    });

    test("synchronize for microservices", async () => {
      const mockSyncMicroservices = jest
        .spyOn(SyncMicroservices.prototype, "synchronize")
        .mockReturnValue();
      try {
        await cmd.run(defaultData);
      } catch (_e: unknown) {
        /* empty */
      }

      expect(mockSyncMicroservices).toHaveBeenCalledWith(mockValues, {
        ...defaultData,
        customName: "onecx-mock",
      });
    });

    test("synchronize for products", async () => {
      const mockSyncProducts = jest
        .spyOn(SyncProducts.prototype, "synchronize")
        .mockReturnValue();
      try {
        await cmd.run(defaultData);
      } catch (_e: unknown) {
        /* empty */
      }

      expect(mockSyncProducts).toHaveBeenCalledWith(mockValues, {
        ...defaultData,
        icon: "icon",
      });
    });

    test("synchronize for slots", async () => {
      const mockSyncSlots = jest
        .spyOn(SyncSlots.prototype, "synchronize")
        .mockReturnValue();
      try {
        await cmd.run(defaultData);
      } catch (_e: unknown) {
        /* empty */
      }

      expect(mockSyncSlots).toHaveBeenCalledWith(mockValues, {
        ...defaultData,
        uiName: "onecx-mock",
      });
    });

    test("synchronize for workspace", async () => {
      const mockSyncWorkspace = jest
        .spyOn(SyncWorkspace.prototype, "synchronize")
        .mockReturnValue();
      try {
        await cmd.run(defaultData);
      } catch (_e: unknown) {
        /* empty */
      }

      expect(mockSyncWorkspace).toHaveBeenCalledWith(mockValues, {
        ...defaultData,
        uiName: "onecx-mock",
      });
    });
  });
});
