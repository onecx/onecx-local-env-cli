# onecx-local-env-cli
This CLI helps you with setting up microservices in the  [onecx-local-env](http://github.com/onecx/onecx-local-env/).

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
You can always display the help for a command using `onecx-local-env-cli help <command>`.

## sync
```shell
onecx-local-env-cli sync [options] <type> <productName> <basePath> <pathToValues>
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
-  `-i, --icon <iconName>`  The icon of the product (default: "pi-briefcase")
-  `-d, --dry`             If should do a dry run (default: false)
-  `-R, --remove`         If synchronization should be removed (default: false)
-  `-v, --verbose`         Print verbose information (default: false)
-  `-h, --help`             display help for command

## menu
```shell
onecx-local-env-cli menu [options] <operation> <appId> [url] [name]
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
onecx-local-env-cli docker [options] <name> <operation> <productName> [uiPath]
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
Then the CLI is available via `onecx-local-env-cli` directly in your terminal.
~
*HINT*: You can use an alias `onecli` for convenience: 
```shell
echo 'alias onecli=onecx-local-env-cli' >> ~/.bashrc
```
or for ZSH
```shell
echo 'alias onecli=onecx-local-env-cli' >> ~/.zshrc
```

# Examples

## Simple Scenario
The example scenario covers one product consisting of svc, bff and ui and is called `onecx-ocean`.
Current directory contains the three folders for `ocean-svc`, `ocean-bff` and `ocean-ui` as well as our `onecx-local-env` folder.

### Add to local env
To begin with, we want to synchronize our microservices into the local-env:
```shell
onecli sync svc onecx-ocean /ocean ./onecx-ocean-svc/helm/values.yml --env ./onecx-local-env 
onecli sync bff onecx-ocean /ocean ./onecx-ocean-bff/helm/values.yml --env ./onecx-local-env 
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