import { ServerContext } from "@modelcontextprotocol/server";

export default function getAuthToken(ctx: ServerContext): string {
  const token = ctx.http?.req?.headers.get('authorization') ?? '';
  return token
}