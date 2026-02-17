import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { spawnSync } from "child_process";

// Configuration from environment variables
const CONFIG = {
  jiraSite: process.env.JIRA_SITE || "storebrand.atlassian.net",
  jiraEmail: process.env.JIRA_EMAIL || "glenn.gunnarsson@spp.se",
  logLevel: process.env.LOG_LEVEL || "info",
};

// Types
interface JiraIssue {
  key: string;
  summary: string;
  status: string;
  assignee?: string;
  created: string;
  updated: string;
}

interface CliResult {
  stdout: string;
  stderr: string;
  success: boolean;
}

// Initialize server
const server = new Server(
  {
    name: "atlassian-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);


// Helper function to execute acli commands
function executeAcliCommand(args: string[]): CliResult {
  try {
    // Use spawnSync to pass arguments directly without shell interpolation
    // This prevents issues with special characters in JQL queries
    const result = spawnSync("acli", args, {
      encoding: "utf-8",
      shell: false, // Don't use shell to avoid escaping issues
      windowsHide: true,
    });

    if (result.error) {
      return {
        stdout: "",
        stderr: result.error.message,
        success: false,
      };
    }

    if (result.status !== 0) {
      return {
        stdout: result.stdout || "",
        stderr: result.stderr || "",
        success: false,
      };
    }

    return {
      stdout: result.stdout || "",
      stderr: result.stderr || "",
      success: true,
    };
  } catch (error: any) {
    return {
      stdout: "",
      stderr: error.message || String(error),
      success: false,
    };
  }
}

// Define available tools
const tools: Tool[] = [
  {
    name: "jira_search",
    description:
      "Search for Jira work items using JQL (Jira Query Language). Use to find issues by project, status, assignee, priority, created/updated dates, and more. Returns a list of matching work items with their key, summary, status, priority, and assignee. " +
      "Common search patterns: " +
      "1) My work: 'assignee = currentUser()' " +
      "2) My active work: 'assignee = currentUser() AND status NOT IN (Done, Closed)' " +
      "3) Project issues: 'project = SSAS' " +
      "4) High priority: 'priority = High' or 'priority IN (High, Highest)' " +
      "5) Recent updates: 'updated >= -7d' (last 7 days) " +
      "6) Combine with AND/OR: 'project = SSAS AND status = Open AND assignee = currentUser()' " +
      "7) Sort results: add 'ORDER BY updated DESC' or 'ORDER BY priority DESC, created ASC'",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description:
            "JQL (Jira Query Language) query string. " +
            "Structure: field operator value [AND/OR field operator value] [ORDER BY field ASC/DESC]. " +
            "Common fields: project, status, assignee, priority, created, updated, summary, description, type. " +
            "Operators: = (equals), != (not equals), IN (list), NOT IN (exclude list), > < >= <= (comparison), ~ (contains text), IS EMPTY, IS NOT EMPTY. " +
            "Functions: currentUser() (logged in user), now() (current time), startOfDay(), startOfWeek(). " +
            "Time: Use formats like -7d (7 days ago), -2w (2 weeks), -1M (1 month). " +
            "IMPORTANT QUOTING RULES: " +
            "1) Multi-word values MUST be in double quotes: status = \"In Progress\" " +
            "2) Email addresses MUST be quoted: assignee = \"user@example.com\" " +
            "3) Special characters (@, #, $, etc.) MUST be in quoted strings " +
            "4) Use currentUser() function instead of email when possible " +
            "5) List values in parentheses: status IN (Open, \"In Progress\", Blocked) " +
            "Examples: " +
            "'assignee = currentUser() ORDER BY updated DESC' - your work by recent update, " +
            "'project = SSAS AND status = Open' - open issues in SSAS project, " +
            "'priority = High AND status != Done' - high priority incomplete work, " +
            "'assignee = currentUser() AND status NOT IN (Done, Closed)' - your active work, " +
            "'updated >= -7d AND project = SSAS' - SSAS project updated in last 7 days, " +
            "'status IN (\"In Progress\", \"Work in progress\") AND assignee = currentUser()' - in-progress items, " +
            "'assignee = \"user@example.com\" AND priority = High' - specific user's high priority work",
        },
        results_limit: {
          type: "number",
          description: "Maximum number of results to return (default: 10, max: 100)",
          default: 10,
        },
      },
      required: ["query"],
    },
  },
  {
    name: "jira_get_issue",
    description:
      "Retrieve detailed information about a specific Jira work item. Shows all fields including description, reporter, watchers, attachments, linked issues, and full history.",
    inputSchema: {
      type: "object" as const,
      properties: {
        issue_key: {
          type: "string",
          description: "The Jira work item key (e.g., 'SSAS-123' or 'PROJ-456')",
        },
      },
      required: ["issue_key"],
    },
  },
  {
    name: "jira_comment",
    description:
      "Add a comment to a Jira work item. Use to provide status updates, ask questions, or share information with the team working on the issue.",
    inputSchema: {
      type: "object" as const,
      properties: {
        issue_key: {
          type: "string",
          description: "The Jira work item key (e.g., 'SSAS-123')",
        },
        comment: {
          type: "string",
          description: "The comment text. Supports markdown formatting.",
        },
      },
      required: ["issue_key", "comment"],
    },
  },
  {
    name: "jira_update_status",
    description:
      "Transition a Jira work item to a new status (e.g., 'In Progress', 'Done', 'Blocked'). Use to move work items through your workflow.",
    inputSchema: {
      type: "object" as const,
      properties: {
        issue_key: {
          type: "string",
          description: "The Jira work item key (e.g., 'SSAS-123')",
        },
        status: {
          type: "string",
          description:
            "The target status to transition to. Example values: 'In Progress', 'Done', 'Blocked', 'Review'",
        },
      },
      required: ["issue_key", "status"],
    },
  },
  {
    name: "jira_assign",
    description:
      "Assign a Jira work item to a user. Use to delegate tasks and clarify ownership of work items.",
    inputSchema: {
      type: "object" as const,
      properties: {
        issue_key: {
          type: "string",
          description: "The Jira work item key (e.g., 'SSAS-123')",
        },
        assignee: {
          type: "string",
          description:
            "The email address or username of the person to assign the work item to (e.g., 'user@example.com')",
        },
      },
      required: ["issue_key", "assignee"],
    },
  },
  {
    name: "jira_set_field",
    description:
      "Update a custom field value on a Jira work item. Use to set fields like components, fix versions, labels, environment, etc.",
    inputSchema: {
      type: "object" as const,
      properties: {
        issue_key: {
          type: "string",
          description: "The Jira work item key (e.g., 'SSAS-123')",
        },
        field: {
          type: "string",
          description: "The field name to update (e.g., 'summary', 'description', 'environment')",
        },
        value: {
          type: "string",
          description: "The value to set for the field",
        },
      },
      required: ["issue_key", "field", "value"],
    },
  },
  {
    name: "jira_add_label",
    description:
      "Add a label/tag to a Jira work item. Use to categorize and organize work items for easier filtering and tracking.",
    inputSchema: {
      type: "object" as const,
      properties: {
        issue_key: {
          type: "string",
          description: "The Jira work item key (e.g., 'SSAS-123')",
        },
        label: {
          type: "string",
          description: "The label to add (single word, no spaces). Examples: 'bug', 'urgent', 'documentation'",
        },
      },
      required: ["issue_key", "label"],
    },
  },
  {
    name: "jira_remove_label",
    description:
      "Remove a label/tag from a Jira work item. Use to clean up or reorganize issue categorization.",
    inputSchema: {
      type: "object" as const,
      properties: {
        issue_key: {
          type: "string",
          description: "The Jira work item key (e.g., 'SSAS-123')",
        },
        label: {
          type: "string",
          description: "The label to remove",
        },
      },
      required: ["issue_key", "label"],
    },
  },
  {
    name: "jira_link_issue",
    description:
      "Create a link between two Jira work items to show relationships. Use to track dependencies, blocking relationships, or related work.",
    inputSchema: {
      type: "object" as const,
      properties: {
        from_issue: {
          type: "string",
          description: "The source Jira work item key (e.g., 'SSAS-123')",
        },
        to_issue: {
          type: "string",
          description: "The target Jira work item key (e.g., 'SSAS-456')",
        },
        link_type: {
          type: "string",
          description: "The relationship type. Common options: 'Relates' (default), 'Blocks', 'Blocked by', 'Duplicate', 'Cloners', 'Part of'. Use the exact name from your Jira instance.",
          default: "Relates",
        },
      },
      required: ["from_issue", "to_issue"],
    },
  },
];

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools,
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const toolInput = request.params.arguments as Record<string, string | number>;

  try {
    switch (toolName) {
      case "jira_search": {
        const query = toolInput.query as string;
        const limit = (toolInput.results_limit as number) || 10;
        const result = executeAcliCommand([
          "jira",
          "workitem",
          "search",
          "--jql",
          query,
          "--limit",
          limit.toString(),
          "--json",
        ]);

        if (!result.success) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error searching for work items: ${result.stderr}`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: `Search results for "${query}":\n${result.stdout}`,
            },
          ],
        };
      }

      case "jira_get_issue": {
        const issueKey = toolInput.issue_key as string;
        const result = executeAcliCommand([
          "jira",
          "workitem",
          "view",
          issueKey,
          "--json",
        ]);

        if (!result.success) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error retrieving work item ${issueKey}: ${result.stderr}`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: `Details for ${issueKey}:\n${result.stdout}`,
            },
          ],
        };
      }

      case "jira_comment": {
        const issueKey = toolInput.issue_key as string;
        const comment = toolInput.comment as string;
        const result = executeAcliCommand([
          "jira",
          "workitem",
          "comment",
          "create",
          "-k",
          issueKey,
          "-b",
          comment,
        ]);

        if (!result.success) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error adding comment to ${issueKey}: ${result.stderr}`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: `Comment added to ${issueKey}`,
            },
          ],
        };
      }

      case "jira_update_status": {
        const issueKey = toolInput.issue_key as string;
        const status = toolInput.status as string;
        const result = executeAcliCommand([
          "jira",
          "workitem",
          "transition",
          "-k",
          issueKey,
          "-s",
          status,
        ]);

        if (!result.success) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error transitioning ${issueKey} to "${status}": ${result.stderr}`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: `Work item ${issueKey} transitioned to "${status}"`,
            },
          ],
        };
      }

      case "jira_assign": {
        const issueKey = toolInput.issue_key as string;
        const assignee = toolInput.assignee as string;
        const result = executeAcliCommand([
          "jira",
          "workitem",
          "assign",
          "-k",
          issueKey,
          "-a",
          assignee,
        ]);

        if (!result.success) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error assigning ${issueKey} to ${assignee}: ${result.stderr}`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: `Work item ${issueKey} assigned to ${assignee}`,
            },
          ],
        };
      }

      case "jira_set_field": {
        const issueKey = toolInput.issue_key as string;
        const field = toolInput.field as string;
        const value = toolInput.value as string;
        const result = executeAcliCommand([
          "jira",
          "workitem",
          "edit",
          "-k",
          issueKey,
          `--${field.toLowerCase()}`,
          value,
        ]);

        if (!result.success) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error updating field "${field}" on ${issueKey}: ${result.stderr}`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: `Work item ${issueKey}: field "${field}" set to "${value}"`,
            },
          ],
        };
      }

      case "jira_add_label": {
        const issueKey = toolInput.issue_key as string;
        const label = toolInput.label as string;
        const result = executeAcliCommand([
          "jira",
          "workitem",
          "edit",
          "-k",
          issueKey,
          "-l",
          label,
        ]);

        if (!result.success) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error adding label "${label}" to ${issueKey}: ${result.stderr}`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: `Label "${label}" added to ${issueKey}`,
            },
          ],
        };
      }

      case "jira_remove_label": {
        const issueKey = toolInput.issue_key as string;
        const label = toolInput.label as string;
        const result = executeAcliCommand([
          "jira",
          "workitem",
          "edit",
          "-k",
          issueKey,
          "--remove-labels",
          label,
        ]);

        if (!result.success) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error removing label "${label}" from ${issueKey}: ${result.stderr}`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: `Label "${label}" removed from ${issueKey}`,
            },
          ],
        };
      }

      case "jira_link_issue": {
        const fromIssue = toolInput.from_issue as string;
        const toIssue = toolInput.to_issue as string;
        const linkType = (toolInput.link_type as string) || "Relates";
        const result = executeAcliCommand([
          "jira",
          "workitem",
          "link",
          "create",
          "--out",
          fromIssue,
          "--in",
          toIssue,
          "--type",
          linkType,
        ]);

        if (!result.success) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error linking work items: ${result.stderr}`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: `Work item ${fromIssue} linked to ${toIssue} with relationship: "${linkType}"`,
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: "text" as const,
              text: `Unknown tool: ${toolName}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error executing tool: ${error}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Atlassian MCP Server started");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
