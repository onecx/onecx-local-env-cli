export interface ValuesSpecification {
  app: {
    image: {
      repository: string;
    };
    operator?: {
      slot: {
        specs: {
          [key: string]: {
            name: string;
            description: string;
          };
        };
      };
      microfrontend: {
        specs: {
          [key: string]: MicrofrontendSpecification;
        };
      };
      permission: {
        spec: {
          permissions: {
            [key: string]: {
              [key: string]: string;
            };
          };
        };
      };
    };
  };
}

export interface MicrofrontendSpecification {
  remoteName: string;
  name: string;
  description: string;
  exposedModule: string;
  note: string;
  technology: string;
  tagName: string;
  type: string;
}

export interface ProductSpecification {
  productName: string;
}

export interface ProductMicrofrontendSpecification {
  appId: string;
  basePath: string;
}

export interface DockerFileContent {
  include?: string[];
  services?: { [key: string]: unknown };
}
