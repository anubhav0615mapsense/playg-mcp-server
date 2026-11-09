import { createMcpHandler } from "@modelcontextprotocol/server";
import { McpServer } from "@modelcontextprotocol/server";
import 'dotenv/config';
import makePlaygReq from "./util/makePlaygReq.js";
import { zipToolConfig } from "./tools/getZipData.js";
import crypto from 'crypto';
import { layerToolConfig } from "./tools/getLayers.js";
import { getOsmQueryConfig, runOsmConfig } from "./tools/osmQueryTools.js";
import { duckDBToolConfig } from "./tools/duckDBQueries.js";
import { districtToolCfg } from "./tools/getDistrictData.js";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { playgResponse } from "./util/playgResponse.js";

const stdioOpts = ['stdio', 'STDIO']

const {
  PLAYG_API_BASE: playgBaseUrl,
  MCP_TYPE: mcpType
} = process.env;

const redisQParam = (key: string) => `?redisKeyName=${key}`;

function createServer() {
  // Creates server instance
  const server = new McpServer({
    name: 'playg-mcp',
    version: '1.0.0'
  });

  // Fetch user layers tool
  server.registerTool(
    "get_user_layers",
    layerToolConfig,
    async ( { id, originalLayerId, fetchAll } ) => {
      
      try {
        let userLayersUrl;
        const keyName = `layer_data:${crypto.randomUUID()}`;

        // Fetches a single layer using id
        if (id) {
          userLayersUrl = `${playgBaseUrl}/api/user-layers/${id}${redisQParam(keyName)}`
        } else if (originalLayerId) {
          userLayersUrl = `${playgBaseUrl}/api/user-layers/versions/${originalLayerId}${redisQParam(keyName)}`
        } else if (fetchAll && fetchAll === true) {
          userLayersUrl = `${playgBaseUrl}/api/user-layers/all${redisQParam(keyName)}`;
        } else {
          userLayersUrl = `${playgBaseUrl}/api/user-layers${redisQParam(keyName)}`;
        }

        const res = await makePlaygReq<playgResponse>('GET', userLayersUrl);

        return {
          content: [
            {
              type: "text",
              text: `${res.data.message}: ${res.data.responseURL}`
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
        const keyName = `zip_data:${crypto.randomUUID()}`;
        const zipURL = `${playgBaseUrl}/api/zip-boundary${redisQParam(keyName)}`;
        const res = await makePlaygReq<playgResponse>('POST', zipURL, { key, value, requiredFields });

        return {
          content: [
            {
              type: "text",
              text: `${res.data.message}: ${res.data.responseURL}`
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
        const keyName = `osm_data:${crypto.randomUUID()}`;
        const osmURL = `${playgBaseUrl}/api/queries/${queryId}/run${redisQParam(keyName)}`;
        const res = await makePlaygReq<playgResponse>('POST', osmURL, { parameters, amenities });

        return {
          content: [
            {
              type: 'text',
              text: `${res.data.message}: ${res.data.responseURL}`
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

      let osmURL = `${playgBaseUrl}/api/queries`;
      const keyName = `fetched_osm_queries:${crypto.randomUUID()}`;

      try {
        
        if (queryId) {
          osmURL = `${osmURL}/${queryId}${redisQParam(keyName)}`;
        } else {
          osmURL = `${osmURL}${redisQParam(keyName)}`;
        }

        const res = await makePlaygReq<playgResponse>('GET', osmURL);

        return {
          content: [
            {
              type: 'text',
              text: `${res.data.message}: ${res.data.responseURL}`
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
    async ( { queryText, remoteQuery } ) => {
      try {
        const ddbUrl = `${playgBaseUrl}/api/duckdbq/run`
        const redisKeyName = `duckdb_query_resp:${crypto.randomUUID()}`;

        const res = await makePlaygReq<playgResponse>('POST', ddbUrl, { queryText, remoteQuery, redisKeyName })

        return {
          content: [
            {
              type: 'text',
              text: `${res.data.message}: ${res.data.responseURL}`
            }
          ]
        };
      } catch (err: any) {
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
    async ( { multipleDtnames, id, dtname } ) => {
      try {

        const keyName = `district_data:${crypto.randomUUID()}`;
        let res, districtDataURL = `${playgBaseUrl}/api/district-boundary${redisQParam(keyName)}`;

        if (multipleDtnames) {
          res = await makePlaygReq<playgResponse>('POST', districtDataURL, { multipleDtnames });
        } else if (id) {
          res = await makePlaygReq<playgResponse>('POST', districtDataURL, { id }); 
        } else {
          res = await makePlaygReq<playgResponse>('POST', districtDataURL, { dtname }); 
        }

        return {
          content: [
            {
              type: "text",
              text: `${res.data.message}: ${res.data.responseURL}`
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

  return server
}

const handler = createMcpHandler(createServer)

async function main() {
  try {
    serveStdio(createServer, {
      onerror: (error) => console.error("Playg MCP Server error:", error)
    })
    console.error("Playg MCP server running on stdio");
  } catch (err) {
    console.error("Fatal error in main():", err);
    process.exit(1);
  }
}

if (mcpType && stdioOpts.includes(mcpType)) main();

export default handler;

process.on('SIGINT', async () => {
  process.exit(0);
})

process.on('SIGTERM', async () => {
  process.exit(0);
})