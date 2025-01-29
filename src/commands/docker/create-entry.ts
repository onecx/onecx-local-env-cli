import { getEnvDirectory, logger } from "../../util/utils";
import { OnecxCommand } from "../onecx-command";
import fs from "fs";
import yaml from "js-yaml";

export interface CreateDockerCommandParameters {
  name: string;
  appName: string;
  sections: string[];
  env: string;
  dry: boolean;
}

export class CreateDockerCommand
  implements OnecxCommand<CreateDockerCommandParameters>
{
  run(data: CreateDockerCommandParameters): void {
    logger.info("Create docker...");
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
      fileContent.include = ["docker-compose.yml"];
    }

    if (!fileContent.services) {
      fileContent.services = {};
    }

    for (let section of data.sections) {
      if (fileContent.services[`${data.appName}-${section}`]) {
        logger.warning(
          `Service ${data.appName}-${section} already exists, skipping...`
        );
      } else {
        fileContent.services[`${data.appName}-${section}`] =
          dockerData[section];
      }
    }

    let yamlContent = yaml.dump(fileContent);
    if (data.dry) {
      logger.info(
        `Dry Run: Would write to ${filePath} with content:`,
        yamlContent
      );
    } else {
      fs.writeFileSync(filePath, yamlContent);
    }
  }

  // Replace - with _
  replaceDashWithUnderscore(name: string): string {
    return name.replace(/-/g, "_");
  }

  generateDocker(data: CreateDockerCommandParameters): { [key: string]: any } {
    let underScoreName = this.replaceDashWithUnderscore(data.appName);
    const sectionTitle = ` ########## ${data.appName.toUpperCase()}`;

    const svc = {
      image: `\${${underScoreName.toUpperCase()}_SVC}`,
      environment: {
        QUARKUS_DATASOURCE_USERNAME: data.appName,
        QUARKUS_DATASOURCE_PASSWORD: data.appName,
        QUARKUS_DATASOURCE_JDBC_URL: `jdbc:postgresql://postgresdb:5432/${data.appName}?sslmode=disable`,
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
        `traefik.http.services.${data.appName}-svc.loadbalancer.server.port=8080`,
        `traefik.http.routers.${data.appName}-svc.rule=Host(\`${data.appName}-svc\`)`,
      ],
      env_file: ["common.env", "svc.env"],
      networks: ["example"],
    };

    const bff = {
      image: `\${${underScoreName.toUpperCase()}_BFF}`,
      environment: {
        ONECX_PERMISSIONS_PRODUCT_NAME: data.appName,
      },
      healthcheck: {
        test: "curl --head -fsS http://localhost:8080/q/health",
        interval: "10s",
        timeout: "5s",
        retries: 3,
      },
      depends_on: {
        [`${underScoreName}-svc`]: {
          condition: "service_healthy",
        },
      },
      labels: [
        `traefik.http.services.${underScoreName}-bff.loadbalancer.server.port=8080`,
        `traefik.http.routers.${underScoreName}-bff.rule=Host(\`${underScoreName}-bff\`)`,
      ],
      env_file: ["common.env", "bff.env"],
      networks: ["example"],
      profiles: ["all"],
    };

    const ui = {
      image: `\${${underScoreName.toUpperCase()}_UI}`,
      environment: {
        APP_BASE_HREF: `/mfe/${data.appName}/`,
        APP_ID: `${data.appName}-ui`,
        PRODUCT_NAME: `${data.appName}`,
      },
      depends_on: {
        [`${underScoreName}-bff`]: {
          condition: "service_healthy",
        },
      },
      labels: [
        `traefik.http.services.${underScoreName}-ui.loadbalancer.server.port=8080`,
        `traefik.http.routers.${underScoreName}-ui.rule=Host(\`local-proxy\`)&&PathPrefix(\`/mfe/${data.appName}/\`)`,
      ],
      networks: ["example"],
      profiles: ["all"],
    };

    return { sectionTitle, ui, bff, svc };
  }
}
