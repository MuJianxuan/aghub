# aghub

> This project is under heavy construction.

**One hub for every AI coding agent.**

[中文版本](./README.CN.md)

---

## Why aghub?

You use Claude Code. Your teammate uses Cursor. Another swears by Windsurf. Each has its own config format, its own file locations, its own way of doing things.

Adding an MCP server means editing three different JSON files in three different places. Sharing a skill requires copying folders across three different directories. You don't even know what capabilities you've configured where.

**aghub is built on a simple idea: your AI tooling should work for you, not against you.**

## The Philosophy

### Stateless by Design

No database. No sync issues. Your files are the source of truth. Uninstall aghub tomorrow and all your configurations remain perfectly intact—nothing locked in, nothing lost.

### Explicit Opt-In

Every change requires your confirmation. No silent modifications. No background syncs. You stay in control of your tooling.

### Universal Compatibility

22+ AI coding agents supported out of the box. Each agent described by data, not hard-coded logic, making it trivial to add new ones.

### Scope Awareness

Know exactly what's configured globally versus per-project. Merge both views when you need the complete picture. Track where every capability came from.

## What You Can Do

**Manage MCP Servers**

- Add servers once, deploy across multiple agents
- Support for Stdio, SSE, and StreamableHttp transports
- Enable/disable servers without deletion
- View all servers across all agents with a single command

**Organize Skills**

- Import skill packages from `.skill` archives
- Create skills locally with SKILL.md frontmatter
- Track provenance—know exactly where each skill came from
- Content integrity via SHA-256 verification

**Stay in Control**

- List capabilities across all agents or filter by one
- Scope queries: global, project, or merged view
- Audit trail of every configured resource
- Marketplace integration for discovering new capabilities

## Who It's For

aghub is for power users of AI coding tools who:

- Use two or more AI assistants regularly
- Want unified tool management without vendor lock-in
- Need to share MCP servers and skills across team members
- Build or distribute MCP servers to multiple platforms

## The Vision

A world where switching AI coding assistants doesn't mean starting over. Where your accumulated knowledge—your skills, your MCP servers, your configurations—travels with you. Where tool choice is driven by capability, not by the friction of reconfiguration.

---

_Works with: Claude Code, OpenCode, OpenAI Codex, Gemini CLI, GitHub Copilot, Cursor, Windsurf, Cline, RooCode, Zed, Mistral Vibe, and 11 more._
