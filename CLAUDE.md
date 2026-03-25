# Project---01 — YouTube Channel Automation

## Docker MCP Client Setup

This project uses the [Docker MCP Server](https://hub.docker.com/r/docker/mcp-server) to give Claude Code the ability to manage Docker resources directly.

### How it works

Claude Code is configured (via `.claude/settings.json`) to launch the Docker MCP server as a Docker container on demand. The MCP server communicates over stdio and mounts the Docker socket so it can control the host Docker daemon.

### Prerequisites

- Docker Engine installed and running
- Docker socket available at `/var/run/docker.sock`

### Connect Claude Code to Docker MCP

The `.claude/settings.json` file already contains the MCP server definition:

```json
{
  "mcpServers": {
    "docker": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "--mount", "type=bind,src=/var/run/docker.sock,dst=/var/run/docker.sock",
        "docker/mcp-server"
      ]
    }
  }
}
```

Claude Code will automatically start this server when a session begins. No manual steps are required beyond having Docker running.

### Alternatively — Docker Desktop (v4.40+)

If you have Docker Desktop 4.40 or later, you can connect directly via:

```bash
docker mcp client connect claude-code
```

This registers the Docker MCP gateway with Claude Code automatically.

### What the Docker MCP server provides

- Build, run, stop, and remove containers
- Manage images (pull, push, build)
- Inspect networks and volumes
- Run `docker compose` operations
- Tail container logs
