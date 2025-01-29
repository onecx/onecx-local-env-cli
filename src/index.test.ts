import { Command } from "commander";
import { OneCXLocalEnvCLI } from ".";
import { RemoveSyncBFFCommand } from "./commands/sync/bff/remove-sync-bff";
import { SyncBFFCommand } from "./commands/sync/bff/sync-bff";
import { RemoveSyncSVCCommand } from "./commands/sync/svc/remove-sync-svc";
import { SyncSVCCommand } from "./commands/sync/svc/sync-svc";
import { RemoveSyncUICommand } from "./commands/sync/ui/remove-sync-ui";
import { SyncUICommand } from "./commands/sync/ui/sync-ui";

describe("Command Parsing", () => {
  let cli: OneCXLocalEnvCLI;
  let cmd: Command;

  beforeEach(() => {
    cli = new OneCXLocalEnvCLI();
    cmd = cli.setup();
  });

  it("should create an instance of OneCXLocalEnvCLI", () => {
    expect(cli).toBeInstanceOf(OneCXLocalEnvCLI);
  });

  it("should run the correct command for sync ui", () => {
    const mockRun = jest
      .spyOn(SyncUICommand.prototype, "run")
      .mockImplementation(() => {});

    const args = ["sync", "ui", "productName", "basePath", "pathToValues"];
    cmd.parse(args, {
      from: "user",
    });

    expect(mockRun).toHaveBeenCalledWith(
      expect.objectContaining({
        productName: "productName",
        basePath: "basePath",
        pathToValues: "pathToValues",
      })
    );
  });

  it("should run the correct command for sync bff", () => {
    const mockRun = jest
      .spyOn(SyncBFFCommand.prototype, "run")
      .mockImplementation(() => {});

    const args = ["sync", "bff", "productName", "basePath", "pathToValues"];
    cmd.parse(args, {
      from: "user",
    });

    expect(mockRun).toHaveBeenCalledWith(
      expect.objectContaining({
        productName: "productName",
        basePath: "basePath",
        pathToValues: "pathToValues",
      })
    );
  });

  it("should run the correct command for sync svc", () => {
    const mockRun = jest
      .spyOn(SyncSVCCommand.prototype, "run")
      .mockImplementation(() => {});

    const args = ["sync", "svc", "productName", "basePath", "pathToValues"];
    cmd.parse(args, {
      from: "user",
    });

    expect(mockRun).toHaveBeenCalledWith(
      expect.objectContaining({
        productName: "productName",
        basePath: "basePath",
        pathToValues: "pathToValues",
      })
    );
  });

  it("should run the correct command for remove sync ui", () => {
    const mockRun = jest
      .spyOn(RemoveSyncUICommand.prototype, "run")
      .mockImplementation(() => {});

    const args = [
      "sync",
      "ui",
      "productName",
      "basePath",
      "pathToValues",
      "--remove",
    ];
    cmd.parse(args, {
      from: "user",
    });

    expect(mockRun).toHaveBeenCalledWith(
      expect.objectContaining({
        productName: "productName",
        basePath: "basePath",
        pathToValues: "pathToValues",
        remove: true,
      })
    );
  });

  it("should run the correct command for remove sync bff", () => {
    const mockRun = jest
      .spyOn(RemoveSyncBFFCommand.prototype, "run")
      .mockImplementation(() => {});

    const args = [
      "sync",
      "bff",
      "productName",
      "basePath",
      "pathToValues",
      "--remove",
    ];
    cmd.parse(args, {
      from: "user",
    });

    expect(mockRun).toHaveBeenCalledWith(
      expect.objectContaining({
        productName: "productName",
        basePath: "basePath",
        pathToValues: "pathToValues",
        remove: true,
      })
    );
  });

  it("should run the correct command for remove sync svc", () => {
    const mockRun = jest
      .spyOn(RemoveSyncSVCCommand.prototype, "run")
      .mockImplementation(() => {});

    const args = [
      "sync",
      "svc",
      "productName",
      "basePath",
      "pathToValues",
      "--remove",
    ];
    cmd.parse(args, {
      from: "user",
    });

    expect(mockRun).toHaveBeenCalledWith(
      expect.objectContaining({
        productName: "productName",
        basePath: "basePath",
        pathToValues: "pathToValues",
        remove: true,
      })
    );
  });
});
