import { logger } from "../../util/utils";
import { OnecxCommand } from "../onecx-command";

export interface ManageDockerCommandParameters {
  operation: "create" | "remove";
  url: string;
  name: string;
  appId: string;
  badge: string;
  env: string;
  dry: boolean;
}

export class ManageDockerCommand
  implements OnecxCommand<ManageDockerCommandParameters>
{
  run(data: ManageDockerCommandParameters): void {
    logger.info("Managing docker...");

    if (data.operation === "create") {
      logger.info("Menu entry created successfully.");
    } else {
      logger.info("Menu entry removed successfully.");
    }
  }

  createAdaptedDockerCompose(data: ManageDockerCommandParameters) {}

  generateDocker(data: ManageDockerCommandParameters): string {
    return `
    ########## ${data.name.toUpperCase()}
    ${data.name}-svc:
      image: \${${data.name.toUpperCase()}_SVC}
      environment:
        QUARKUS_DATASOURCE_USERNAME: ${data.name}
        QUARKUS_DATASOURCE_PASSWORD: ${data.name}
        QUARKUS_DATASOURCE_JDBC_URL: "jdbc:postgresql://postgresdb:5432/${
          data.name
        }?sslmode=disable"
      healthcheck:
        test: curl --head -fsS http://localhost:8080/q/health
        interval: 10s
        timeout: 5s
        retries: 3
      depends_on:
        postgresdb:
          condition: service_healthy
      labels:
        - "traefik.http.services.${data.name}-svc.loadbalancer.server.port=8080"
        - "traefik.http.routers.${data.name}-svc.rule=Host(\`${
      data.name
    }-svc\`)"
      env_file:
        - common.env
        - svc.env
      networks:
        - example

    ${data.name}-bff:
      image: \${${data.name.toUpperCase()}_BFF}
      environment:
        ONECX_PERMISSIONS_PRODUCT_NAME: "${data.name}"
      healthcheck:
        test: curl --head -fsS http://localhost:8080/q/health
        interval: 10s
        timeout: 5s
        retries: 3
      depends_on:
        ${data.name}-svc:
          condition: service_healthy
      labels:
        - "traefik.http.services.${data.name}-bff.loadbalancer.server.port=8080"
        - "traefik.http.routers.${data.name}-bff.rule=Host(\`${
      data.name
    }-bff\`)"
      env_file:
        - common.env
        - bff.env
      networks:
        - example
      profiles:
        - all

    ${data.name}-ui:
      image: \${${data.name.toUpperCase()}_UI}
      environment:
        APP_BASE_HREF: "/mfe/${data.name}/"
        APP_ID: "${data.name}-ui"
        PRODUCT_NAME: "${data.name}"
      depends_on:
        ${data.name}-bff:
          condition: service_healthy
      labels:
        - "traefik.http.services.${data.name}-ui.loadbalancer.server.port=8080"
        - "traefik.http.routers.${
          data.name
        }-ui.rule=Host(\`local-proxy\`)&&PathPrefix(\`/mfe/${data.name}/\`)"
      networks:
        - example
      profiles:
        - all
      `;
  }
}

/**
 * rvices:
  ########## ONECX-WELCOME
  onecx-welcome-svc:
    image: ${ONECX_WELCOME_SVC}
    environment:
      QUARKUS_DATASOURCE_USERNAME: onecx_welcome
      QUARKUS_DATASOURCE_PASSWORD: onecx_welcome
      QUARKUS_DATASOURCE_JDBC_URL: "jdbc:postgresql://postgresdb:5432/onecx_welcome?sslmode=disable"
    healthcheck:
      test: curl --head -fsS http://localhost:8080/q/health
      interval: 10s
      timeout: 5s
      retries: 3
    depends_on:
      postgresdb:
        condition: service_healthy
    labels:
      - "traefik.http.services.onecx-welcome-svc.loadbalancer.server.port=8080"
      - "traefik.http.routers.onecx-welcome-svc.rule=Host(`onecx-welcome-svc`)"
    env_file:
      - common.env
      - svc.env
    networks:
      - example

  onecx-welcome-bff:
    image: ${ONECX_WELCOME_BFF}
    environment:
      ONECX_PERMISSIONS_PRODUCT_NAME: "onecx-welcome"
    healthcheck:
      test: curl --head -fsS http://localhost:8080/q/health
      interval: 10s
      timeout: 5s
      retries: 3
    depends_on:
      onecx-welcome-svc:
        condition: service_healthy
    labels:
      - "traefik.http.services.onecx-welcome-bff.loadbalancer.server.port=8080"
      - "traefik.http.routers.onecx-welcome-bff.rule=Host(`onecx-welcome-bff`)"
      # - "traefik.http.routers.local_mfe.entrypoints=web"
      # - "traefik.http.routers.local_mfe.rule=Host(`local-proxy`)&&PathPrefix(`/mfe/welcome/`)"
      # - "traefik.http.routers.local_mfe.service=local_mfe@file"
    env_file:
      - common.env
      - bff.env
    networks:
      - example
    profiles:
      - all

  onecx-welcome-ui:
    image: ${ONECX_WELCOME_UI}
    environment:
      APP_BASE_HREF: "/mfe/welcome/"
      APP_ID: "onecx-welcome-ui"
      PRODUCT_NAME: "onecx-welcome"
    depends_on:
      onecx-welcome-bff:
        condition: service_healthy
    labels:
      - "traefik.http.services.onecx-welcome-ui.loadbalancer.server.port=8080"
      - "traefik.http.routers.onecx-welcome-ui.rule=Host(`local-proxy`)&&PathPrefix(`/mfe/welcome/`)"
    networks:
      - example
    profiles:
      - all
 */
