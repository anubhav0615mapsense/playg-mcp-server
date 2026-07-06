import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {createClient} from 'redis';
import 'dotenv/config';
import makePlaygReq from "./util/makePlaygReq.js";
import { ZipResponse, zipToolConfig } from "./tools/getZipData.js";
import crypto from 'crypto';
import { layerToolConfig, MultipleLayersResponse, SingleLayerResponse } from "./tools/getLayers.js";

const playgBaseUrl = process.env.PLAYG_API_BASE ?? '';
const redisUrl = process.env.REDIS_URL

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