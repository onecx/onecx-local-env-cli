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
import * as valuesUtil from "../shared/values.utils";

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
    let mockValuesYAML;
    beforeEach(() => {
      jest.clearAllMocks();
      jest.restoreAllMocks();
      
      jest.spyOn(fs, "existsSync").mockReturnValue(true);
      jest.spyOn(fs, "writeFileSync").mockReturnValue();

      mockValuesYAML = jest
        .spyOn(valuesUtil, "retrieveValuesYAML")
        .mockReturnValue(
          new Promise((r) => {
            r(mockValues);
          })
        );
    });

    test("synchronize for microfrontends", async () => {
      let mockSyncMicrofrontends = jest
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
        let mockSyncPermissions = jest
          .spyOn(SyncPermissions.prototype, "synchronize")
          .mockReturnValue();
        try {
          await cmd.run(defaultData);
        } catch (e) {}

        expect(mockSyncPermissions).toHaveBeenCalledWith(mockValues, {
          ...defaultData,
          appName: "onecx-mock",
          roleName: "role",
        });
      });

      test("synchronize for microservices", async () => {
        let mockSyncMicroservices = jest
          .spyOn(SyncMicroservices.prototype, "synchronize")
          .mockReturnValue();
        try {
          await cmd.run(defaultData);
        } catch (e) {}

        expect(mockSyncMicroservices).toHaveBeenCalledWith(mockValues, {
          ...defaultData,
          customName: "onecx-mock",
        });
      });

      test("synchronize for products", async () => {
        let mockSyncProducts = jest
          .spyOn(SyncProducts.prototype, "synchronize")
          .mockReturnValue();
        try {
          await cmd.run(defaultData);
        } catch (e) {}

        expect(mockSyncProducts).toHaveBeenCalledWith(mockValues, {
          ...defaultData,
          icon: "icon",
        });
      });

      test("synchronize for slots", async () => {
        let mockSyncSlots = jest
          .spyOn(SyncSlots.prototype, "synchronize")
          .mockReturnValue();
        try {
          await cmd.run(defaultData);
        } catch (e) {}

        expect(mockSyncSlots).toHaveBeenCalledWith(mockValues, {
          ...defaultData,
          uiName: "onecx-mock",
        });
      });

      test("synchronize for workspace", async () => {
        let mockSyncWorkspace = jest
          .spyOn(SyncWorkspace.prototype, "synchronize")
          .mockReturnValue();
        try {
          await cmd.run(defaultData);
        } catch (e) {}

        expect(mockSyncWorkspace).toHaveBeenCalledWith(mockValues, {
          ...defaultData,
          uiName: "onecx-mock",
        });
      });
  });
});
