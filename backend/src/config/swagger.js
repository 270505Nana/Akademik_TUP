import swaggerJSDoc from 'swagger-jsdoc';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Academic TUP API Documentation',
      version: '1.0.0',
      description: 'API Boilerplate with Express, ESModules, Prisma, and Swagger JS Docs',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        PaginationMeta: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              example: 1,
              description: 'Current page number',
            },
            limit: {
              type: 'integer',
              example: 10,
              description: 'Number of items per page',
            },
            total: {
              type: 'integer',
              example: 50,
              description: 'Total number of items matching the filter',
            },
            totalPages: {
              type: 'integer',
              example: 5,
              description: 'Total number of pages',
            },
          },
        },
      },
      parameters: {
        pageQueryParam: {
          in: 'query',
          name: 'page',
          schema: {
            type: 'integer',
            default: 1,
            minimum: 1,
          },
          description: 'Page number for pagination (default: 1)',
        },
        limitQueryParam: {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'string',
            default: '10',
          },
          description: 'Number of items per page (e.g. 10, 20, 50, or "all" to disable pagination)',
        },
      },
    },
  },
  // Parse Swagger JSDoc from all route files
  apis: [
    path.join(__dirname, '../routes/*.js').replace(/\\/g, '/'),
    path.join(__dirname, '../routes/**/*.js').replace(/\\/g, '/'),
  ],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

export default swaggerSpec;
