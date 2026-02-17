# Quick Start Guide

Get the Atlassian MCP Server running in under 5 minutes.

## Prerequisites

Install required tools:

```powershell
# Install Atlassian CLI
winget install Atlassian.AtlassianCli

# Install Node.js (if not already installed)
winget install OpenJS.NodeJS.LTS

# Restart your terminal after installation
```

## Setup

### 1. Configure Atlassian CLI

Authenticate with your Jira instance:

```powershell
acli jira auth login
```

Provide:
- Jira URL: `https://storebrand.atlassian.net`
- Email: `you@spp.se`
- API Token: [Get from here](https://id.atlassian.com/manage-profile/security/api-tokens)

Test it works:

```powershell
acli jira workitem search --jql "assignee = currentUser()" --limit 5
```

### 2. Build the MCP Server

```powershell
cd c:\vcs\atlassian-mcp
npm install
npm run build
```

### 3. Configure VS Code Globally

Add the MCP server to your VS Code settings:

**Option A: Via Settings UI**
1. Open VS Code Settings (`Ctrl+,`)
2. Search for "mcp" or "chat: mcp"
3. Click "Edit in settings.json"
4. Add the server configuration

**Option B: Direct Edit**

Open/create `%APPDATA%\Code\User\settings.json` and add:

```json
{
  "github.copilot.chat.mcp.servers": {
    "atlassian-mcp": {
      "type": "stdio",
      "command": "node",
      "args": ["c:\\vcs\\atlassian-mcp\\dist\\index.js"],
      "env": {
        "JIRA_SITE": "storebrand.atlassian.net",
        "JIRA_EMAIL": "your.email@spp.se"
      }
    }
  }
}
```

Update the path and email, then restart VS Code.

## Using the MCP

Ask Copilot natural language questions:

- "Find my open work items"
- "Add a comment to SSAS-3415 saying I'm working on it"
- "Show me high priority issues in the SSAS project"
- "Move SSAS-3415 to In Progress"

## Available Tools

| Tool | Purpose |
|------|---------|
| `jira_search` | Search issues with JQL queries |
| `jira_get_issue` | Get full details of an issue |
| `jira_comment` | Add comments to issues |
| `jira_update_status` | Transition issue status |
| `jira_assign` | Assign issues to users |
| `jira_set_field` | Update custom fields |
| `jira_add_label` | Add labels to issues |
| `jira_remove_label` | Remove labels from issues |
| `jira_link_issue` | Link related issues |

## JQL Query Examples

```jql
assignee = currentUser()
assignee = currentUser() AND status NOT IN (Done, Closed)
project = SSAS AND priority = High
updated >= -7d
status = "In Progress" AND assignee = currentUser()
```

## Troubleshooting

**acli not found:** Restart terminal after installing  
**Auth fails:** Run `acli jira auth login` again  
**MCP not loading:** Restart VS Code after building

## Development

```powershell
npm run watch    # Auto-rebuild on changes
npm run dev      # Build and start
```
