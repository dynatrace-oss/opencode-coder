# Next-Gen Agents Notes

Brainstorming notes for the next generation of agent capabilities.

## How to Do System Reminders for Different Agents

### The Problem

We want to inject per-turn reminders that the LLM sees but the user doesn't. Different agents need different reminders — a tasker should be reminded about different things than a verifier or the orchestrator.

### Chosen Approach: `chat.message` Hook

The `chat.message` hook fires before every LLM call and lets us modify `output.parts` on the user's message. This is the right mechanism because:

- Fires automatically on every user message — no manual API calls needed
- Modifies the existing message (no separate messages cluttering history)
- Zero risk of agent switching (unlike `session.prompt` which requires passing `model`/`agent`)
- Minimal code — just push a part onto `output.parts`

### Why NOT Other Approaches

| Approach | Why Not |
|----------|---------|
| `experimental.chat.system.transform` | Lives in system prompt, not per-message. Also `experimental.` API. |
| Synthetic `session.prompt` with `noReply: true` | Creates separate messages, requires async API call, agent switching risk, more complex |
| `config` hook with `instructions` | Static file paths only, not dynamic, not per-agent |

### Implementation Pattern

The `chat.message` hook receives the current agent in `input.agent`. We use this to select which reminders to inject:

```typescript
"chat.message": async (input, output) => {
  const agent = input.agent; // e.g. "tasker", "verifier", "orchestrator", "reviewer"
  const reminders = getRemindersForAgent(agent);

  if (reminders) {
    output.parts.push({
      type: "text",
      text: reminders,
      synthetic: true, // hidden from user UI, visible to LLM
    });
  }
},
```

### Agent-Specific Reminders

Each agent has different responsibilities and failure modes. Reminders should reinforce the most critical behaviors.

#### Orchestrator (primary agent)

```
<system-reminder>
- Persist beads state with supported `bd` Dolt commands before ending the session
- Check `bd ready` after every tasker completes to find newly unblocked work
- Update beads immediately when discussion changes scope or approach
- Do NOT edit code directly when a tasker should be doing the work
</system-reminder>
```

#### Tasker

```
<system-reminder>
- You are working on exactly ONE task — stay focused, do not drift
- Run tests/lint after making changes (check AGENTS.md for commands)
- Close the task with `bd close` when done, including a summary of what changed
- Do NOT create new beads issues — report new findings back to the orchestrator
</system-reminder>
```

#### Reviewer

```
<system-reminder>
- Be critical — your job is to find holes, not approve
- Create new beads issues (bugs, tasks, gates) for every problem you find
- Do NOT fix problems yourself — only identify and file them
- Focus on correctness, completeness, and edge cases
</system-reminder>
```

#### Verifier

```
<system-reminder>
- Verify against the acceptance criteria in the gate/task description
- Run actual commands to verify — do not trust assumptions
- Create bug issues for every failure, with reproduction steps
- Close gates only when ALL criteria are met — partial passes are failures
</system-reminder>
```

### Reminder Storage

Options for where reminders live:

1. **Hardcoded in plugin** — simplest, reminders change with plugin releases
2. **In agent markdown files** (`ai-resources/agents/*.md`) — already have agent configs there, could add a frontmatter field or dedicated section
3. **In a dedicated config file** (e.g. `.coder/reminders.yaml`) — most flexible, user-customizable

### Open Questions

- Should reminders be configurable per-project or only at the plugin level?
- Should we support conditional reminders (e.g. only remind about tests if tests exist)?
- How verbose should reminders be? Too many tokens per turn adds up.
- Should reminders change based on session phase (planning vs execution)?
- Do we need a way to disable/override reminders?

## Reacting to Tool Calls: Post-Execution Hooks

### The Problem

We want to run custom logic whenever the agent executes specific tools — for example, reacting when `bd create` is called to auto-sync state, inject follow-up context, or track what was created.

### The Hook: `tool.execute.after`

The SDK provides a first-class `tool.execute.after` hook that fires after every tool call completes:

```typescript
"tool.execute.after"?: (
  input: {
    tool: string;       // Tool name — "bash", "read", "write", etc.
    sessionID: string;
    callID: string;     // Unique ID for this invocation
    args: any;          // Arguments passed to the tool
  },
  output: {
    title: string;      // Summary of the result (mutable)
    output: string;     // The actual tool output (mutable)
    metadata: any;      // Arbitrary metadata (mutable)
  }
) => Promise<void>;
```

There is also `tool.execute.before` which fires before execution and lets you inspect/modify `args` before the tool runs.

### Key Detail: `bd` Runs as Bash

Since `bd` is a CLI tool invoked via the `bash` tool, `input.tool` will always be `"bash"`. To detect beads commands specifically, we need to parse `input.args.command`:

```typescript
"tool.execute.after": async (input, output) => {
  if (input.tool !== "bash") return;

  const command = input.args?.command as string | undefined;
  if (!command) return;

  // Detect bd create commands
  if (command.match(/^bd\s+create\b/)) {
    await handleBeadsCreate(input, output);
  }
},
```

### Use Case: React to `bd create`

When an agent creates a beads issue (`bd create`), we want to run post-creation logic. Possible actions:

#### 1. Parse what was created and track it

```typescript
async function handleBeadsCreate(
  input: { sessionID: string; args: any },
  output: { output: string }
) {
  // output.output contains the bd create result (e.g. the new issue ID)
  const issueId = parseIssueIdFromOutput(output.output);
  const command = input.args.command as string;

  // Detect issue type from the command flags
  const isEpic = command.includes("--type=epic") || command.includes("-t epic");
  const isTask = command.includes("--type=task") || command.includes("-t task");
  const isBug = command.includes("--type=bug") || command.includes("-t bug");
  const isGate = command.includes("--type=gate") || command.includes("-t gate");

  // Track creation per session for later use
  trackCreatedIssue(input.sessionID, { issueId, isEpic, isTask, isBug, isGate });
}
```

#### 2. Auto-sync after creation

```typescript
// Automatically persist beads changes after any bd create
if (command.match(/^bd\s+create\b/)) {
  // Could trigger `bd dolt commit` / `bd dolt push`, though this might be better left to the agent
}
```

#### 3. Inject follow-up context via synthetic message

```typescript
// After an epic is created, remind the agent to create tasks for it
if (isEpic) {
  await client.session.prompt({
    path: { id: input.sessionID },
    body: {
      noReply: true,
      parts: [{
        type: "text",
        text: `<system-reminder>Epic created (${issueId}). Now break it down into tasks with bd create --type=task --parent=${issueId}</system-reminder>`,
        synthetic: true,
      }],
    },
  });
}
```

#### 4. Enrich the tool output

Since `output` is mutable, we can append to the output the agent sees:

```typescript
// Add helpful context to the tool result
if (isEpic) {
  output.output += "\n\n[Plugin] Next step: create tasks for this epic using bd create --type=task --parent=<id>";
}
```

### Other `bd` Commands Worth Hooking

| Command Pattern | React To |
|----------------|----------|
| `bd create` | Track new issues, inject follow-up reminders |
| `bd close` | Update session state, check if parent epic is now completable |
| `bd ready` | Cache the result for reminders, know what's unblocked |
| `bd dolt commit` / `bd dolt push` | Confirm persistence succeeded, update plugin state |
| `bd update` | Track scope changes |

### Combining with `chat.message` Reminders

The two mechanisms work together:

1. **`tool.execute.after`** — reacts to specific tool calls, updates plugin state, injects one-off context
2. **`chat.message`** — uses that state to inject ongoing per-turn reminders

Example flow:
- Agent calls `bd create --type=epic` → `tool.execute.after` records that an epic exists but has no tasks yet
- Next user message → `chat.message` reminder says "You have an epic with no tasks — break it down"
- Agent calls `bd create --type=task --parent=...` three times → `tool.execute.after` records tasks exist
- Next user message → `chat.message` reminder switches to "Tasks are ready — check bd ready for unblocked work"

### Open Questions

- Should we parse `bd` output with a proper parser or just regex? (bd output format may change)
- Should `tool.execute.after` inject synthetic messages directly, or only update state for `chat.message` to use?
- Performance: how much overhead does parsing every bash command add?
- Should we also hook `tool.execute.before` to validate `bd` commands before they run?

## Context Window Awareness & Compaction Detection

### The Problem

We want the plugin to be aware of how full the context window is — both to adapt agent behavior (e.g. shorter reminders when context is tight) and to know when compaction is about to happen (so we can prepare, re-inject critical state, etc.).

### What IS Available

#### Context Window Size — YES ✅

The `Model` type includes hard limits, accessible in multiple hooks:

```typescript
// Available in: chat.params, chat.headers, experimental.chat.system.transform
input.model.limit.context   // max context window (tokens)
input.model.limit.output    // max output tokens
input.model.limit.input     // max input tokens (v2 SDK only)
```

Full `Model` type also includes cost info, capabilities, and provider details — useful for adapting behavior per model.

#### Per-Message Token Usage — YES ✅

Each `AssistantMessage` carries token counts:

```typescript
AssistantMessage.tokens: {
  total?: number;      // v2 only
  input: number;       // tokens sent TO the model (≈ current context size)
  output: number;      // tokens generated
  reasoning: number;   // reasoning/thinking tokens
  cache: {
    read: number;      // cached tokens read
    write: number;     // cached tokens written
  };
}
```

Also available per-step via `StepFinishPart.tokens` (same shape). Accessible through `message.updated` and `message.part.updated` events in the `event` hook.

#### Compaction Config — YES ✅ (v2)

```typescript
Config.compaction: {
  auto?: boolean;      // auto-compaction enabled (default: true)
  prune?: boolean;     // prune old tool outputs (default: true)
  reserved?: number;   // token buffer to avoid overflow during compaction
}
```

Readable via the `config` hook, but this is user-facing config — it does NOT expose the actual trigger threshold.

#### Compaction Events — YES ✅ (but limited)

| Signal | When | What You Get |
|--------|------|--------------|
| `experimental.session.compacting` hook | Before compaction starts | `sessionID` only — no token info |
| `session.compacted` event | After compaction completes | `sessionID` only |
| `CompactionPart` in messages | During compaction | `{ type: "compaction", auto: boolean, overflow?: boolean }` |
| `Session.time.compacting` | While compacting | Timestamp set during compaction (via `session.updated` events) |
| `ContextOverflowError` (v2) | On overflow | Error on `AssistantMessage.error` — context actually overflowed |

### What is NOT Available

The OpenCode UI shows a "25% used" context indicator — but this is computed **client-side by the TUI**, not exposed through the SDK. The `Session` type has no token fields at all:

```typescript
export type Session = {
  id: string;
  slug: string;
  title: string;
  time: { created: number; updated: number; compacting?: number; archived?: number; };
  // ... NO tokens, NO usage, NO percentage
};
```

And `SessionStatus` is just `idle | retry | busy` — no context info either.

| Missing | Notes |
|---------|-------|
| Running session token total | No cumulative field on `Session` — must compute manually |
| Current context occupancy | No "how full is the window right now?" metric — the UI computes this itself |
| Compaction trigger threshold | Not exposed — internal to OpenCode |
| "Approaching compaction" warning | No proactive event or signal |
| Percentage of context used ("25% used") | Computed by the TUI, NOT available to plugins via SDK |

**Bottom line:** The "25% used" indicator exists only in the UI layer. Plugins must reconstruct this from the raw building blocks (`tokens.input` from messages + `model.limit.context`).

### Workaround: Reconstructing the "% Used" Indicator

A plugin can approximate context usage by tracking `tokens.input` from the latest assistant message and comparing against `Model.limit.context`. This is essentially what the UI does:

```typescript
// Plugin state
let latestInputTokens = 0;
let contextLimit = 0;

// Capture model limits from chat.params
"chat.params": async (input, _output) => {
  contextLimit = input.model.limit.context;
},

// Track token usage from events
event: async ({ event }) => {
  if (event.type === "message.updated") {
    const msg = event.properties.message;
    if (msg.role === "assistant" && msg.tokens) {
      latestInputTokens = msg.tokens.input;
    }
  }
},
```

Then use this in reminders or decision-making:

```typescript
function getContextFillPercentage(): number {
  if (!contextLimit) return 0;
  return latestInputTokens / contextLimit;
}

// In chat.message hook — adapt reminder verbosity
"chat.message": async (input, output) => {
  const fill = getContextFillPercentage();

  if (fill > 0.8) {
    // Context is getting full — use minimal reminders to save tokens
    output.parts.push({
      type: "text",
      text: "<system-reminder>Context is ~80% full. Be concise. Wrap up or compact soon.</system-reminder>",
      synthetic: true,
    });
  } else {
    // Normal reminders
    output.parts.push({
      type: "text",
      text: getRemindersForAgent(input.agent),
      synthetic: true,
    });
  }
},
```

### Compaction Lifecycle: Full Hook Strategy

To properly handle compaction, combine all available signals:

```typescript
// 1. Before compaction — save critical state
"experimental.session.compacting": async (input, output) => {
  // Inject context that should survive compaction
  const beadsState = await getCurrentBeadsState();
  output.context.push(`## Active Beads State\n${beadsState}`);
},

// 2. After compaction — re-inject reminders and reset token tracking
event: async ({ event }) => {
  if (event.type === "session.compacted") {
    const sessionID = event.properties.sessionID;
    latestInputTokens = 0; // Reset — context was compacted

    // Re-inject any session-specific context that was lost
    await client.session.prompt({
      path: { id: sessionID },
      body: {
        noReply: true,
        parts: [{
          type: "text",
          text: "<system-reminder>Session was compacted. Run bd list --status=in_progress to re-orient.</system-reminder>",
          synthetic: true,
        }],
      },
    });
  }
},
```

### How This Connects to Reminders and Tool Hooks

All three mechanisms form a coherent system:

```
┌─────────────────────────────────────────────────────┐
│                   Plugin State                       │
│                                                      │
│  - Context fill %  (from message.updated events)     │
│  - Created issues  (from tool.execute.after)         │
│  - Current agent   (from chat.message input)         │
│  - Session phase   (inferred from beads state)       │
│                                                      │
├──────────────┬──────────────────┬────────────────────┤
│              │                  │                     │
│  chat.message│ tool.execute.after│ session.compacting │
│  (per-turn   │ (post-tool       │ (pre-compaction    │
│   reminders) │  reactions)      │  state save)       │
│              │                  │                     │
│  Reads state │ Updates state    │ Persists state     │
│  to adapt    │ based on what    │ so it survives     │
│  reminders   │ agent did        │ compaction         │
└──────────────┴──────────────────┴────────────────────┘
```

### Open Questions

- Is `tokens.input` a reliable proxy for context occupancy? (It includes cache hits which don't count against the window)
- Should we warn the agent at 60%, 80%, or 90% fill? What's the right threshold?
- Should we auto-trigger `bd dolt commit` or `bd dolt push` before compaction to ensure beads state is saved?
- Can we use `compaction.reserved` to calculate a more accurate "remaining capacity"?
