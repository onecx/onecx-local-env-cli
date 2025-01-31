#! /usr/bin/env node

import { Argument, Command } from "commander"; // add this line

import { CreateMenuEntryCommand } from "./commands/menu/create-menu-entry";
import { RemoveMenuEntryCommand } from "./commands/menu/remove-menu-entry";
import { RemoveSyncBFFCommand } from "./commands/sync/bff/remove-sync-bff";
import { SyncBFFCommand } from "./commands/sync/bff/sync-bff";
import { RemoveSyncSVCCommand } from "./commands/sync/svc/remove-sync-svc";
import { SyncSVCCommand } from "./commands/sync/svc/sync-svc";
import { RemoveSyncUICommand } from "./commands/sync/ui/remove-sync-ui";
import { SyncUICommand } from "./commands/sync/ui/sync-ui";
import { logger } from "./util/utils";
import { CreateDockerCommand } from "./commands/docker/create-entry";
import { RemoveDockerCommand } from "./commands/docker/remove-entry";

//add the following line
export class OneCXLocalEnvCLI {
  setup(): Command {
    const program = new Command();
    const cli = program
      .version("1.0.0")
      .description(
        "The onecx-local-env CLI helps to work with the local environment"
      );

    cli
      .command("sync")
      .addArgument(
        new Argument("<type>", "type of microservice").choices([
          "ui",
          "bff",
          "svc",
        ])
      )
      .argument("<productName>", "The name of the product")
      .argument("<basePath>", "The base path of the product")
      .argument(
        "<pathToValues>",
        "The path or URL to the values.yaml file of the microservice"
      )
      .option("-e, --env <path>", "Path to the local environment", "./")
      .option(
        "-n, --name <name>",
        "Custom name for the UI, if repository should not be used"
      )
      .option(
        "-r, --role <role>",
        "Role name for the assignments",
        "onecx-admin"
      )
      .option(
        "-i, --icon <iconName>",
        "The icon of the product",
        "pi-briefcase"
      )
      .option("-d, --dry", "If should do a dry run", false)
      .option("-R, --remove", "If synchronization should be removed", false)
      .option("-v, --verbose", "Print verbose information", false)
      .action((type, productName, basePath, pathToValues, options) => {
        if (options.verbose) {
          process.env.VERBOSE = "true";
        }
        try {
          logger.verbose(
            `Running sync command with options: ${JSON.stringify(options)}`
          );
          logger.verbose(`Product name: ${productName}`);
          logger.verbose(`Base path: ${basePath}`);
          logger.verbose(`Path to values: ${pathToValues}`);
          this.getSyncCommandForType(type, options.remove).run({
            pathToValues,
            productName,
            basePath,
            ...options,
          });
        } catch (error: any) {
          logger.error(error.message);
        }
      });

    cli
      .command("menu")
      .addArgument(
        new Argument("<operation>", "operation to do").choices([
          "create",
          "remove",
        ])
      )
      .argument("<appId>", "The application id to link to (unique for entry)")
      .argument("[url]", "The URL of the menu entry")
      .argument("[name]", "The name of the menu entry")
      .option("-e, --env <path>", "Path to the local environment", "./")
      .option(
        "-b, --badge <iconName>",
        "The badge of the menu entry",
        "briefcase"
      )
      .option(
        "-w, --workspace <workspace>",
        "The name of the workspace",
        "admin"
      )
      .option(
        "-r, --roles <roles...>",
        "The roles this menu entry is visible for",
        "onecx-admin"
      )
      .option("-d, --dry", "If should do a dry run", false)
      .option("-v, --verbose", "Print verbose information", false)
      .action((operation, appId, url, name, options) => {
        if (options.verbose) {
          process.env.VERBOSE = "true";
        }
        logger.verbose(
          `Running menu command with options: ${JSON.stringify(options)}`
        );
        url = url ?? `/${appId.toLowerCase().replace(" ", "-")}`;
        name = name ?? appId.replace("-", " ");
        logger.verbose(`Operation: ${operation}`);
        logger.verbose(`URL: ${url}`);
        logger.verbose(`Name: ${name}`);
        logger.verbose(`App ID: ${appId}`);

        if (operation === "create") {
          new CreateMenuEntryCommand().run({
            appId,
            url,
            name,
            ...options,
          });
        } else {
          new RemoveMenuEntryCommand().run({
            appId,
            url,
            name,
            ...options,
          });
        }
      });

    cli
      .command("docker")
      .argument("<name>", "The name of the custom docker compose")
      .addArgument(
        new Argument("<operation>", "operation to do").choices([
          "create",
          "remove",
        ])
      )
      .argument("<productName>", "The name of the product")
      .argument(
        "[uiPath]",
        "Path the UI should be accessibled at (mfe/<uiPath>/)"
      )
      .option("-s, --sections <sections...>", "The sections to generate", [
        "svc",
        "bff",
        "ui",
      ])
      .option("-e, --env <path>", "Path to the local environment", "./")
      .option("-f, --force", "Force (re)creation", false)
      .option("-d, --dry", "If should do a dry run", false)
      .option("-v, --verbose", "Print verbose information", false)
      .option("--adapt-dot-env", "Adapt image definition in .env file", false)
      .action((name, operation, productName, uiPath, options) => {
        if (options.verbose) {
          process.env.VERBOSE = "true";
        }
        logger.verbose(
          `Running menu command with options: ${JSON.stringify(options)}`
        );
        logger.verbose(`Operation: ${operation}`);
        logger.verbose(`Name: ${name}`);
        logger.verbose(`Product Name: ${productName}`);
        logger.verbose(`UI Path: ${uiPath}`);

        if (operation === "create") {
          new CreateDockerCommand().run({
            operation,
            name,
            uiPath,
            productName,
            ...options,
          });
        } else {
          new RemoveDockerCommand().run({
            operation,
            name,
            productName,
            ...options,
          });
        }
      });

    return program;
  }

  getSyncCommandForType(type: "ui" | "bff" | "svc", removal: boolean = false) {
    switch (type) {
      case "ui":
        return removal ? new RemoveSyncUICommand() : new SyncUICommand();
      case "bff":
        return removal ? new RemoveSyncBFFCommand() : new SyncBFFCommand();
      case "svc":
        return removal ? new RemoveSyncSVCCommand() : new SyncSVCCommand();
      default:
        throw new Error(`Unknown type: ${type}`);
    }
  }
}

const cli = new OneCXLocalEnvCLI().setup();
// Only run the command if the script is called directly
if (require.main === module) {
  try {
    cli.parse(process.argv, {
      from: "node",
    });
  } catch (error: any) {
    logger.error(error.message);
  }
}
