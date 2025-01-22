# onecx-local-env-cli
This CLI helps you with setting up microservices in the onecx-local-env

# Usage
To use an UI in the onecx-local-env, you have to first perform the synchronization using the sync command.
After it was synchronized, you need to either add the UI to the docker compose as an image, or run it locally as described in the onecx-local-env repository.

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

