# onecx-local-env-cli

**Command Line Interface for OneCX Local Environment**

This package provides functionality to set up custom microservices in the OneCX Local Environment, see 
[Repository](http://github.com/onecx/onecx-local-env/) and 
[Documentation](https://onecx.github.io/docs/documentation/current/onecx-local-env/index.html).

> The current version is fully compatible with the [`onecx-local-env` v2 edition](https://github.com/onecx/onecx-local-env/blob/main/versions/v2/README.md).
If you are still using [`onecx-local-env` v1](https://github.com/onecx/onecx-local-env/blob/main/versions/v1/README.md), please make sure to use `onecx-local-env-cli` version `1.5.2` or smaller by appending the version to all commands (e.g. `npx @onecx/local-env-cli@1.5.2 sync`). Due to v1 edition is outdated, it is recommended to use the current edition v2 of the loval environment. If you want to benefit from the latest features without switching to v2, you can also use the latest version of `onecx-local-env-cli` and manually adjust the generated output to be compatible with v1.


# Installation

The simplest way to use the CLI in current version is to use the [npm package](https://www.npmjs.com/package/@onecx/local-env-cli) directly on your product directory via `npx @onecx/local-env-cli`.

# Usage

## Synchronization
To use an UI in the onecx-local-env, you have to first perform the synchronization using the sync command.
After it was synchronized, you need to either add the UI to the docker compose as an image, or run it locally as described in the onecx-local-env repository.
You can also use a remote `values.yml` by using the URL to it's raw content (e.g., on GitHub).

## Menu entries
You can create menu entries, that will appear under a new "Custom Applications" top menu in the sidebar.
The appId will be used as the unique identifier for the entry.
When providing custom roles, these roles will be applied for this "Custom Applications" entry as well as for the created entry itself.


## Docker
The docker command helps you to quickly setup a custom docker-compose for your apps which will extend the default one.
The parameter `name` will be applied as the file name: `<name>.docker-compose.yaml`.

If you want to generate an **UI-Section** (by default ui, bff & svc are generated), you need to provide the additional argument `uiPath` which will determine the sub-path for the traefik label (`/mfe/<uiPath>/`).


# Commands
You can always display the help for a command using `npx @onecx/local-env-cli help <command>`.

## sync
```shell
npx @onecx/local-env-cli sync [options] <type> <productName> <basePath> <pathToValues>
```

Arguments:
-  `type`                   The type of microservice (choices: "ui", "bff", "svc")
-  `productName`            The name of the product
-  `basePath`               The base path of the product
-  `pathToValues`           The path or URL to the values.yaml file of the microservice

Options:
-  `-e, --env <path>`       Path to the local environment (default: "./")
-  `-n, --name <name>`      Custom name for the UI, if repository should not be used
-  `-r, --role <role>`      Role name for the assignments (default: "onecx-admin")
-  `-w, --workspaceName <workspace>` Workspace name to add the App to (default: "admin")
-  `-i, --icon <iconName>`  The icon of the product (default: "pi-briefcase")
-  `-d, --dry`             If should do a dry run (default: false)
-  `-R, --remove`         If synchronization should be removed (default: false)
-  `-v, --verbose`         Print verbose information (default: false)
-  `-h, --help`             display help for command

## menu
```shell
npx @onecx/local-env-cli menu [options] <operation> <appId> [url] [name]
```

Arguments:
- `operation`               operation to do (choices: - "create", "remove")
- `appId`                   The application id to link to (unique for entry)
- `url`                     The URL of the menu entry
- `name`                     The name of the menu entry

Options:
-  `-e, --env <path>`        Path to the local environment (default: "./")
-  `-b, --badge <iconName>`  The badge of the menu entry (default: "briefcase")
-  `-w, --workspace <workspace>`  The name of the workspace (default: "admin")
-  `-r, --roles <roles...>`       The roles this menu entry is visible for (default: "onecx-admin")
-  `-d, --dry`               If should do a dry run (default: false)
-  `-v, --verbose`           Print verbose information (default: false)
-  `-h, --help`              display help for command

## docker
```shell
npx @onecx/local-env-cli docker [options] <name> <operation> <productName> [uiPath]
```

Arguments:
-  `name`                        The name of the custom docker compose
-  `operation`                     operation to do (choices: "create", "remove")
-  `productName`                   The name of the product
-  `uiPath`                        Path the UI should be accessibled at (`mfe/<uiPath>/`)

Options:
-  `-s, --sections <sections...>`  The sections to generate (default: ["svc","bff","ui"])
-  `-e, --env <path>`              Path to the local environment (default: "./")
-  `-f, --force`                   Force (re)creation (default: false)
-  `-d, --dry`                     If should do a dry run (default: false)
-  `-v, --verbose`                 Print verbose information (default: false)
-  `--adapt-dot-env`               Adapt image definition in .env file (default: false)
-  `-h, --help`                    display help for command

# Local Testing & Installation
To perform local testing you can install the CLI globally on your machine:
Perform `npm run build && npm i -g .` inside the cli repository to build and install.
Then the CLI is available via `local-env-cli` directly in your terminal.
~
*HINT*: You can use an alias `onecli` for convenience: 
```shell
echo 'alias onecli=npx @onecx/local-env-cli' >> ~/.bashrc
```
or for ZSH
```shell
echo 'alias onecli=npx @onecx/local-env-cli' >> ~/.zshrc
```

# Examples

Hint: In this example we will use the alias command explained above.
## Simple Scenario
The example scenario covers one product consisting of svc, bff and ui and is called `onecx-ocean`.
Current directory contains the three folders for `ocean-svc`, `ocean-bff` and `ocean-ui` as well as our `onecx-local-env` folder.

### Add to local env
To begin with, we want to synchronize our microservices into the local-env:
```shell
onecli sync svc onecx-ocean /ocean ./onecx-ocean-svc/src/main/helm/values.yml --env ./onecx-local-env 
onecli sync bff onecx-ocean /ocean ./onecx-ocean-bff/src/main/helm/values.yml --env ./onecx-local-env 
onecli sync ui onecx-ocean /ocean ./onecx-ocean-ui/helm/values.yml --env ./onecx-local-env 
```

These three commands will synchronize the responding microservices for a product with the name `onecx-ocean` and base-path `/ocean`.

### Add to docker compose
Next, we want our apps to be run via docker container and therefore create a custom docker compose:

```shell
onecli docker custom create onecx-ocean ocean --env ./onecx-local-env --adapt-dot-env
```

This will create a new `custom.docker-compose.yaml` file including our ocean microservices.
Now we need to assure, that all microservices have built docker images locally and assert that the name and version match the values in `./onecx-local-env/.env`:
```properties
ONECX_OCEAN_UI=onecx-ocean-ui:999-SNAPSHOT
ONECX_OCEAN_BFF=onecx-ocean-bff:999-SNAPSHOT
ONECX_OCEAN_SVC=onecx-ocean-svc:999-SNAPSHOT
```

### Create menu entry
To access our UI, we want to create a menu entry:

```shell
onecli menu create onecx-ocean-ui /ocean "Ocean UI" --env ../onecx-local-env 
```
The URL matches our previously configured product basePath to access it.

### Import to database
Lastly and most importantly we need to import all create files into the database.
Therefore we execute the import script:
```shell
bash ./onecx-local-env/import-onecx.sh
```

### Summary
We synchronized our microservices into the local env, created services in our custom docker compose and a menu entry for our UI. Now it should be accessible via menu (Custom Apps => Ocean UI).