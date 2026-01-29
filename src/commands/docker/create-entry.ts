import { getEnvDirectory, logger } from "../../util/utils";
import { OnecxCommand } from "../onecx-command";
import fs from "fs";
import yaml from "js-yaml";
import { DockerFileContent } from "../sync/types";

export interface CreateDockerCommandParameters {
  name: string;
  productName: string;
  uiPath: string;
  sections: string[];
  env: string;
  dry: boolean;
  force: boolean;
  adaptDotEnv: boolean;
}

export class CreateDockerCommand
  implements OnecxCommand<CreateDockerCommandParameters>
{
  run(data: CreateDockerCommandParameters): void {
    logger.info("Create docker...");

    if (!data.sections.includes("'ui") && !data.uiPath) {
      throw new Error(
        "Argument 'uiPath' is required for section: ui, aborting."
      );
    }
    this.createAdaptedDockerCompose(data);
    logger.info(
      `Created custom docker-compose file at ${data.name}.compose.yaml`
    );
  }

  createAdaptedDockerCompose(data: CreateDockerCommandParameters) {
    const envDirectory = getEnvDirectory("", data.env);
    const fileName = `${data.name}.compose.yaml`;
    const filePath = `${envDirectory}/${fileName}`;

    let fileContent: DockerFileContent = {};
    if (fs.existsSync(filePath)) {
      const composeFile = fs.readFileSync(filePath, "utf8");
      fileContent = yaml.load(composeFile) as DockerFileContent;
    }

    const dockerData = this.generateDocker(data);

    if (!fileContent.include) {
      fileContent.include = ["compose.yaml"];
    }

    if (!fileContent.services) {
      fileContent.services = {};
    }

    for (const section of data.sections) {
      if (
        fileContent.services[`${data.productName}-${section}`] &&
        !data.force
      ) {
        logger.warning(
          `Service ${data.productName}-${section} already exists (use -f to force), skipping...`
        );
      } else {
        if (fileContent.services[`${data.productName}-${section}`]) {
          logger.warning(
            `Forced replacement for service: ${data.productName}-${section}`
          );
        } else {
          logger.info(`Added new section: ${data.productName}-${section}`);
        }
        fileContent.services[`${data.productName}-${section}`] =
          dockerData[section];
      }
    }

    let yamlContent = yaml.dump(fileContent, {
      lineWidth: -1,
      quotingType: '"',
      forceQuotes: false,
    });
    
    // Fix YAML merge key syntax - remove quotes around << and anchor references
    yamlContent = yamlContent.replace(/"<<":\s*"(\*[^"]+)"/g, '<<: $1');
    
    if (data.dry) {
      logger.info(
        `Dry Run: Would write to ${filePath} with content:\n${yamlContent}`
      );
    } else {
      fs.writeFileSync(filePath, yamlContent);
    }

    if (data.adaptDotEnv) {
      const envPath = `${envDirectory}/.env`;
      let envFile = fs.readFileSync(envPath, "utf8");
      const dashName = data.productName.replace(/_/g, "-");
      const underscoreName = data.productName.replace(/-/g, "_").toUpperCase();
      const content = [];

      for (const section of data.sections) {
        const key = `${underscoreName}_${section.toUpperCase()}`;
        if (envFile.includes(key)) {
          logger.warning(`[.env] Entry for ${key} already exists, skipping...`);
        } else {
          content.push(`${key}=${dashName}-${section}:main`);
          logger.info(`[.env] Added new entry for ${key}`);
        }
      }
      if (content.length > 0) {
        envFile += "\n";
        content.forEach((l) => (envFile += `${l}\n`));
      }
      if (data.dry) {
        logger.info(
          `Dry Run: Would write to ${envPath} with content:`,
          envFile
        );
      } else {
        logger.info("[.env] Updated .env");
        fs.writeFileSync(envPath, envFile);
      }
    }
  }

  generateDocker({ productName, uiPath }: CreateDockerCommandParameters): {
    [key: string]: unknown;
  } {
    const underscoreName = productName.replace(/-/g, "_");
    const dashName = productName.replace(/_/g, "-");
    const sectionTitle = ` ########## ${dashName}`;

    const svc = {
      image: `\${${underscoreName.toUpperCase()}_SVC}`,
      container_name: `${dashName}-svc`,
      environment: {
        "<<": "*svc_multi_tenancy",
        QUARKUS_DATASOURCE_USERNAME: underscoreName,
        QUARKUS_DATASOURCE_PASSWORD: underscoreName,
        QUARKUS_DATASOURCE_JDBC_URL: `jdbc:postgresql://postgresdb:5432/${underscoreName}?sslmode=disable`,
      },
      healthcheck: {
        test: "curl --head -fsS http://localhost:8080/q/health",
        interval: "10s",
        timeout: "5s",
        retries: 3,
      },
      depends_on: {
        [`keycloak-app`]: {
          condition: "service_healthy",
        },
      },
      labels: [
        `traefik.http.services.${dashName}-svc.loadbalancer.server.port=8080`,
        `traefik.http.routers.${dashName}-svc.rule=Host(\`${dashName}-svc\`)`,
      ],
      networks: ["onecx"],
      profiles: [
        "all",
        "data-import"
      ],
    };

    const bff = {
      image: `\${${underscoreName.toUpperCase()}_BFF}`,
      container_name: `${dashName}-bff`,
      environment: {
        "<<": "*bff_environment",
        ONECX_PERMISSIONS_PRODUCT_NAME: dashName,
      },
      healthcheck: {
        test: "curl --head -fsS http://localhost:8080/q/health",
        interval: "10s",
        timeout: "5s",
        retries: 3,
      },
      depends_on: {
        [`${dashName}-svc`]: {
          condition: "service_healthy",
        },
      },
      labels: [
        `traefik.http.services.${dashName}-bff.loadbalancer.server.port=8080`,
        `traefik.http.routers.${dashName}-bff.rule=Host(\`${dashName}-bff\`)`,
      ],
      networks: ["onecx"],
      profiles: [
        "all"
      ],
    };

    const ui = {
      image: `\${${underscoreName.toUpperCase()}_UI}`,
      container_name: `${dashName}-ui`,
      environment: {
        APP_BASE_HREF: `/mfe/${uiPath}/`, // NEEDS CUSTOM NAME
        APP_ID: `${dashName}-ui`,
        PRODUCT_NAME: `${dashName}`,
      },
      depends_on: {
        [`${dashName}-bff`]: {
          condition: "service_healthy",
        },
      },
      labels: [
        `traefik.http.services.${dashName}-ui.loadbalancer.server.port=8080`,
        `traefik.http.routers.${dashName}-ui.rule=Host(\`onecx.localhost\`) && PathPrefix(\`/mfe/${uiPath}/\`)`,
      ],
      networks: ["onecx"],
      profiles: [
        "all"
      ],
    };

    return { sectionTitle, ui, bff, svc };
  }
}
