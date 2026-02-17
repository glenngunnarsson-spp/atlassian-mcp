# Atlassian MCP Server

MCP server that lets AI assistants interact with Jira through the Atlassian CLI.

## Quick Start

See [QUICKSTART.md](QUICKSTART.md) for installation and setup.

## Features

✅ Search issues with JQL queries  
✅ View full issue details  
✅ Add comments  
✅ Update status/transitions  
✅ Assign to users  
✅ Manage labels and custom fields  
✅ Link related issues  

## How It Works

The MCP server calls the Atlassian CLI (`acli`) commands:
1. AI assistant calls an MCP tool (e.g., `jira_search`)
2. MCP server executes corresponding `acli` command
3. Results are parsed and returned to the AI

## Prerequisites

- Node.js 18+
- Atlassian CLI: `winget install Atlassian.AtlassianCli`
- Authenticated Jira account: `acli jira auth login`

## Available Tools

| Tool | Description |
|------|-------------|
| `jira_search` | Search with JQL queries |
| `jira_get_issue` | Get issue details |
| `jira_comment` | Add comments |
| `jira_update_status` | Change status |
| `jira_assign` | Assign to user |
| `jira_set_field` | Update custom fields |
| `jira_add_label` | Add labels |
| `jira_remove_label` | Remove labels |
| `jira_link_issue` | Link issues |

## Usage Example

Ask your AI assistant:
- "Find my open work items"
- "Add a comment to PROJ-123"
- "Show high priority issues"
- "Move PROJ-456 to In Progress"

The AI will automatically use the appropriate MCP tools.

## Development

```powershell
npm install     # Install dependencies
npm run build   # Build TypeScript
npm run watch   # Auto-rebuild on changes
npm start       # Run the server
```

## Links

- [Quick Start Guide](QUICKSTART.md)
- [MCP Documentation](https://modelcontextprotocol.io)
- [Atlassian CLI](https://github.com/atlassian-labs/atlassian-cli)
