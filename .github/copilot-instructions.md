# Atlassian CLI MCP Server

## Project Setup

This workspace contains an MCP (Model Context Protocol) server that integrates with the Atlassian CLI (`acli`) to provide tools for searching, commenting on, and manipulating Jira issues.

### Prerequisites

- **Atlassian CLI** installed via winget: `winget install Atlassian.AtlassianCli`
- **Node.js** and **npm** installed
- **TypeScript** for development

### Building and Running

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Run the server:**
   ```bash
   npm start
   ```

4. **Development with watch mode:**
   ```bash
   npm run watch
   ```

### MCP Server Configuration

The server is configured in `.vscode/mcp.json` with the following settings:
- **Type:** stdio (standard input/output)
- **Command:** `node dist/index.js`

### Available Tools

The MCP server exposes the following tools through the Model Context Protocol:

1. **jira_search** - Search for Jira issues using JQL queries
2. **jira_get_issue** - Get detailed information about a specific issue
3. **jira_comment** - Add comments to Jira issues
4. **jira_update_status** - Update issue status
5. **jira_assign** - Assign issues to users
6. **jira_set_field** - Set custom field values
7. **jira_add_label** - Add labels to issues
8. **jira_remove_label** - Remove labels from issues
9. **jira_link_issue** - Link two issues together

### Atlassian CLI Documentation

For more information about the Atlassian CLI, visit:
- [Atlassian CLI GitHub Repository](https://github.com/atlassian-labs/atlassian-cli)
- [MCP Documentation](https://modelcontextprotocol.io)

### Debugging in VS Code

To debug this MCP server:
1. Set breakpoints in the source files
2. Use VS Code's debugger with the configured launch settings
3. The server communicates via stdio, which can be monitored in the debug console
