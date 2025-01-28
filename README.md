# onecx-local-env-cli
This CLI helps you with setting up microservices in the  [onecx-local-env](http://github.com/onecx/onecx-local-env/).

# Usage

## Synchronization
To use an UI in the onecx-local-env, you have to first perform the synchronization using the sync command.
After it was synchronized, you need to either add the UI to the docker compose as an image, or run it locally as described in the onecx-local-env repository.


## Menu entries
You can create menu entries, that will appear under a new "Custom Applications" top menu in the sidebar.
The appId will be used as the unique identifier for the entry.

# Commands

## sync
Usage: onecx-local-env-cli sync [options] <type> <productName> <basePath> <pathToValues>

Arguments:
  type                   type of microservice (choices: "ui", "bff", "svc")
  productName            The name of the product
  basePath               The base path of the product
  pathToValues           The path to the values.yaml file of the microservice

Options:
  -e, --env <path>       Path to the local environment (default: "./")
  -n, --name <name>      Custom name for the UI, if repository should not be used
  -r, --role <role>      Role name for the assignments (default: "onecx-admin")
  -i, --icon <iconName>  The icon of the product (default: "pi-briefcase")
  -d, --dry              If should do a dry run (default: false)
  -R, --remove           If synchronization should be removed (default: false)
  -v, --verbose          Print verbose information (default: false)
  -h, --help             display help for command

## menu
Usage: onecx-local-env-cli menu [options] <operation> <appId> [url] [name]

Arguments:
  operation               operation to do (choices: "create", "remove")
  appId                   The application id to link to (unique for entry)
  url                     The URL of the menu entry
  name                    The name of the menu entry

Options:
  -e, --env <path>        Path to the local environment (default: "./")
  -b, --badge <iconName>  The badge of the menu entry (default: "briefcase")
  -d, --dry               If should do a dry run (default: false)
  -v, --verbose           Print verbose information (default: false)
  -h, --help              display help for command


# Local Testing & Installation
To perform local testing you can install the CLI globally on your machine:
Perform `npm run build && npm i -g .` inside the cli repository to build and install.
Then the CLI is available via `onecx-local-env-cli` directly in your terminal.