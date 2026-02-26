import { Type } from "@sinclair/typebox";

const BASE = process.env.MCP_MAIL_INVOKE_URL ?? "http://host.docker.internal:8300/invoke";

async function call(tool: string, args: any, ctx: any = {}) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ tool, ctx, args }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`mcp-mail invoke failed: ${res.status} ${text}`);
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

export default function (api: any) {
  api.registerTool({
    name: "mail_search",
    description: "Search email via the mail MCP (forwards to mcp-mail /invoke search).",
    parameters: Type.Object({
      query: Type.String({ description: "Search query (provider-specific). Example: from:foo subject:bar newer_than:7d" }),
      max_results: Type.Optional(Type.Number({ description: "Max results to return." })),
    }),
    async execute(_id: string, params: any) {
      const out = await call("search", params);
      return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
    },
  });

  api.registerTool({
    name: "mail_list_items",
    description: "List recent email items via the mail MCP (list_items).",
    parameters: Type.Object({
      max_results: Type.Optional(Type.Number()),
      folder: Type.Optional(Type.String({ description: "Optional folder/label if supported by the MCP." })),
    }),
    async execute(_id: string, params: any) {
      const out = await call("list_items", params);
      return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
    },
  });

  api.registerTool({
    name: "mail_get_item",
    description: "Fetch a single email item via the mail MCP (get_item).",
    parameters: Type.Object({
      id: Type.String({ description: "Message/item id." }),
    }),
    async execute(_id: string, params: any) {
      const out = await call("get_item", params);
      return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
    },
  });

  api.registerTool({
    name: "mail_send_email",
    description: "Send an email via the mail MCP (send_email).",
    parameters: Type.Object({
      to: Type.Array(Type.String()),
      subject: Type.String(),
      body: Type.String(),
      cc: Type.Optional(Type.Array(Type.String())),
      bcc: Type.Optional(Type.Array(Type.String())),
    }),
    async execute(_id: string, params: any) {
      const out = await call("send_email", params);
      return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
    },
  });
}
