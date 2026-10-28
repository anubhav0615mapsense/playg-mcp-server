# PLAYG-MCP

## Prerequisites -

- Node.js version 24.18.0 or later is required to build and run the MCP server.
VS Code installed and configured with copilot, or any other IDE/AI application (like Claude Code or Claude Desktop, etc).
- Must have a local setup of the playground-api project, if testing locally.
Redis setup is required - the same instance should be configured for both the playground-api and playg-mcp setups.
- Refer to env-example in the project folder for the env variables required to create the .env file.
- In order to run remote DuckDB queries, the necessary env variables need to be set for the quack URI and authToken of the target DuckDB server.