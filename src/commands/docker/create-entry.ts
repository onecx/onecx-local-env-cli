import { getEnvDirectory, logger } from "../../util/utils";
import { OnecxCommand } from "../onecx-command";
import fs from "fs";
import yaml from "js-yaml";

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
      `Created custom docker-compose file at ${data.name}.docker-compose.yml`
    );
  }

  createAdaptedDockerCompose(data: CreateDockerCommandParameters) {
    let envDirectory = getEnvDirectory("", data.env);
    const fileName = `${data.name}.docker-compose.yml`;
    const filePath = `${envDirectory}/${fileName}`;

    let fileContent: any = {};
    if (fs.existsSync(filePath)) {
      const composeFile = fs.readFileSync(filePath, "utf8");
      fileContent = yaml.load(composeFile);
    }

    let dockerData = this.generateDocker(data);

    if (!fileContent.include) {
      fileContent.include = ["docker-compose.yaml"];
    }

    if (!fileContent.services) {
      fileContent.services = {};
    }

    for (let section of data.sections) {
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
    });
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
      let dashName = data.productName.replace(/_/g, "-");
      let underscoreName = data.productName.replace(/-/g, "_").toUpperCase();
      let content = [];

      for (let section of data.sections) {
        let key = `${underscoreName}_${section.toUpperCase()}`;
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
    [key: string]: any;
  } {
    let underscoreName = productName.replace(/-/g, "_");
    let dashName = productName.replace(/_/g, "-");
    const sectionTitle = ` ########## ${dashName}`;

    const svc = {
      image: `\${${underscoreName.toUpperCase()}_SVC}`,
      environment: {
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
        postgresdb: {
          condition: "service_healthy",
        },
      },
      labels: [
        `traefik.http.services.${dashName}-svc.loadbalancer.server.port=8080`,
        `traefik.http.routers.${dashName}-svc.rule=Host(\`${dashName}-svc\`)`,
      ],
      env_file: ["common.env", "svc.env"],
      networks: ["example"],
    };

    const bff = {
      image: `\${${underscoreName.toUpperCase()}_BFF}`,
      environment: {
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
      env_file: ["common.env", "bff.env"],
      networks: ["example"],
      profiles: ["all"],
    };

    const ui = {
      image: `\${${underscoreName.toUpperCase()}_UI}`,
      environment: {
        APP_BASE_HREF: `/mfe/${uiPath}/`, // NEEDS CUSTOM NAME
        APP_ID: `${dashName}-ui`,
        PRODUCT_NAME: `${dashName}`,
      },
      depends_on: {
        [`${underscoreName}-bff`]: {
          condition: "service_healthy",
        },
      },
      labels: [
        `traefik.http.services.${dashName}-ui.loadbalancer.server.port=8080`,
        `traefik.http.routers.${dashName}-ui.rule=Host(\`local-proxy\`)&&PathPrefix(\`/mfe/${uiPath}/\`)`,
      ],
      networks: ["example"],
      profiles: ["all"],
    };

    return { sectionTitle, ui, bff, svc };
  }
}
