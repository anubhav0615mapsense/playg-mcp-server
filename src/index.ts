import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from 'redis';
import 'dotenv/config';
import makePlaygReq from "./util/makePlaygReq.js";
import { ZipResponse, zipToolConfig } from "./tools/getZipData.js";
import crypto from 'crypto';
import { layerToolConfig, MultipleLayersResponse, SingleLayerResponse } from "./tools/getLayers.js";
import { getOsmQueryConfig, MultipleOsmQueriesResponse, OsmRunQueryResponse, runOsmConfig, SingleOsmQueryResponse } from "./tools/osmQueryTools.js";
import { DuckDBInstance } from '@duckdb/node-api';
import { duckDBToolConfig } from "./tools/duckDBQueries.js";
import { writeFile } from "fs/promises";
import { DistrictDataResp, districtToolCfg } from "./tools/getDistrictData.js";

const playgBaseUrl = process.env.PLAYG_API_BASE ?? '';
const redisUrl = process.env.REDIS_URL;
const instancePath = process.env.INSTANCE_PATH;
const filePath = process.env.FILE_PATH;

const instance = await DuckDBInstance.create(instancePath);

const redisClient = createClient({
  url: redisUrl
});

// Creates server instance
const server = new McpServer({
  name: 'playg-mcp',
  version: '1.0.0'
});

// Fetch user layers tool
server.registerTool(
  "get_user_layers",
  layerToolConfig,
  async ( { id, originalLayerId } ) => {
    
    try {
      let userLayersUrl, fetchedLayersRes;
      const keyName = `layer_data:${crypto.randomUUID()}`;
      const layerJsonUri = `Response_URL: ${playgBaseUrl}/api/get-json?key=${keyName}`;

      // Fetches a single layer using id
      if (id) {
        userLayersUrl = `${playgBaseUrl}/api/user-layers/${id}`
        fetchedLayersRes = await makePlaygReq<SingleLayerResponse>('GET', userLayersUrl);

        const { data } = fetchedLayersRes;
        await redisClient.set(keyName, JSON.stringify(data, null, 2));

        return {
          content: [
            {
              type: "text",
              text: layerJsonUri
            }
          ]
        };

      } else if (originalLayerId) {
        userLayersUrl = `${playgBaseUrl}/api/user-layers/versions/${originalLayerId}`
        fetchedLayersRes = await makePlaygReq<MultipleLayersResponse>('GET', userLayersUrl)

        const { data } = fetchedLayersRes;
        await redisClient.set(keyName, JSON.stringify(data, null, 2));

        return {
          content: [
            {
              type: "text",
              text: layerJsonUri
            }
          ]
        };
      }

      userLayersUrl = `${playgBaseUrl}/api/user-layers`;
      fetchedLayersRes = await makePlaygReq<MultipleLayersResponse>('GET', userLayersUrl);

      const { data } = fetchedLayersRes;
      await redisClient.set(keyName, JSON.stringify(data, null, 2));

      return {
        content: [
          {
            type: "text",
            text: layerJsonUri
          }
        ]
      }

    } catch (err: any) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: JSON.stringify(err.message)
          }
        ]
      }
    }
  } 
)

// Fetch zip data tool
server.registerTool(
  "get_zip_data",
  zipToolConfig,
  async ( { key, value, requiredFields } ) => {

    try {
      const zipURL = `${playgBaseUrl}/api/zip-boundary`;
      const zipData = await makePlaygReq<ZipResponse>('POST', zipURL, { key, value, requiredFields });

      const { data } = zipData;
      if (!data.length) {
        return {
          content: [
            {
              type: "text",
              text: "No/ Empty zip boundary data returned for the given key-value pair"
            }
          ]
        };
      }

      const keyName = `zip_data:${crypto.randomUUID()}`;
      await redisClient.set(keyName, JSON.stringify(data));
      const zipJsonUri = `Response_URL: ${playgBaseUrl}/api/get-json?key=${keyName}`;

      return {
        content: [
          {
            type: "text",
            text: zipJsonUri
          }
        ]
      }
    } catch (err: any) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: JSON.stringify(err.message)
          }
        ]
      }
    }
  }
);

// Tool for running an osm query
server.registerTool(
  'run_osm_query',
  runOsmConfig,
  async ({ queryId, parameters, amenities }) => {
    try {
      const osmURL = `${playgBaseUrl}/api/queries/${queryId}/run`;
      const osmData = await makePlaygReq<OsmRunQueryResponse>('POST', osmURL, { parameters, amenities });

      const { data } = osmData;
      const keyName = `osm_data:${crypto.randomUUID()}`;
      await redisClient.set(keyName, JSON.stringify(data));
      const osmJsonUri = `Response_URL: ${playgBaseUrl}/api/get-json?key=${keyName}`;

      return {
        content: [
          {
            type: 'text',
            text: osmJsonUri
          }
        ]
      }

    } catch (err: any) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: JSON.stringify(err.message)
          }
        ]
      }
    }
  }
);

// Tool for fetching all available osm queries/single osm query using query id
server.registerTool(
  'get_osm_query',
  getOsmQueryConfig,
  async ({ queryId }) => {

    let osmURL = `${playgBaseUrl}/api/queries`
    let osmData; 

    try {
      
      if (queryId) {
        osmURL = `${osmURL}/${queryId}`;
        osmData = await makePlaygReq<SingleOsmQueryResponse>('GET', osmURL);
      } else {
        osmData = await makePlaygReq<MultipleOsmQueriesResponse>('GET', osmURL);
        
        if (!osmData.data.length) {
          return {
            content: [
              {
                type: 'text',
                text: 'Empty response: No queries were found'
              }
            ]
          };
        }
      }

      const { data } = osmData;
      const keyName = `fetched_osm_queries:${crypto.randomUUID()}`;
      await redisClient.set(keyName, JSON.stringify(data));
      const fetchedOsmQsUri = `Response_URL: ${playgBaseUrl}/api/get-json?key=${keyName}`;

      return {
        content: [
          {
            type: 'text',
            text: fetchedOsmQsUri
          }
        ]
      }
    } catch (err: any) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: JSON.stringify(err.message)
          }
        ]
      }
    }
  }
);

// Tool for running DuckDB queries
server.registerTool(
  "run_duck_db_queries",
  duckDBToolConfig,
  async ( { queryText, saveAsJSON, fileNameJSON } ) => {
    try {
      const connection = await instance.connect();
      let responseURL;

      if (saveAsJSON === true && !filePath) throw new Error("File path needs to be specified to save query responses")
      if (saveAsJSON === true && !fileNameJSON) throw new Error("File name needs to be provided to save query responses")

      const result = await connection.run(queryText);
      const data = await result.getRowObjectsJson();

      if (saveAsJSON === true) {
        await writeFile(`${filePath}/${fileNameJSON}.json`, JSON.stringify(data, null, 2), 'utf8');
      } else {
        const keyName = `duckdb_query_resp:${crypto.randomUUID()}`;
        await redisClient.set(keyName, JSON.stringify(data, null, 2));
        responseURL = ` Response_URL: ${playgBaseUrl}/api/get-json?key=${keyName}`;
      }

      return {
        content: [
          {
            type: 'text',
            text: `Query/Queries executed successfully.${responseURL? responseURL: ''}`
          }
        ]
      };
    } catch (err: any) {
      if (err.message === 'Invalid string length') {
        err.message = 'Query response size limit exceeded'
      }
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: err.message
          }
        ]
      }
    }
  }
)

// Tool for fetching district boundary data

server.registerTool(
  "get_district_data",
  districtToolCfg,
  async ( { dtname } ) => {
    try {
      const districtData = await makePlaygReq<DistrictDataResp>('POST', `${playgBaseUrl}/api/district-boundary`, { dtname });

      const { data } = districtData;
      const keyName = `district_data:${crypto.randomUUID()}`;
      await redisClient.set(keyName, JSON.stringify(data));
      const districtDataURL = `Response_URL: ${playgBaseUrl}/api/get-json?key=${keyName}`;

      return {
        content: [
          {
            type: "text",
            text: districtDataURL
          }
        ]
      }
    } catch (err: any) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: err.message
          }
        ]
      }
    }
  }
)



redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
})

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  await redisClient.connect();
  console.error("Playg MCP server running on stdio");
}

main().catch((error) => {
  redisClient.close();
  console.error("Fatal error in main():", error);
  process.exit(1);
})

process.on('SIGINT', async () => {
  await redisClient.close();
  process.exit(0);
})

process.on('SIGTERM', async () => {
  await redisClient.close();
  process.exit(0);
})