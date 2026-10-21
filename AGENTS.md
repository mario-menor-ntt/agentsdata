## Business Context

This project is a retail sales analytics dashboard for business users.

The primary goal is to help business stakeholders understand sales performance through reliable KPIs, interactive visualizations, and actionable insights.

The dashboard is a self-contained HTML file with an embedded, validated data snapshot. Keep that architecture unless a different approach is explicitly approved.

## Agent Guidance

When working on this project:

- Prioritize business insights over visual complexity.
- Validate data quality before calculating or presenting KPIs.
- Identify the Supabase tables used for each metric.
- Report data-quality limitations before making recommendations.
- Prefer simple, business-readable dashboards with interactive filtering.
- Avoid introducing external dependencies unless explicitly approved.

## Data Access and Quality

- Use the configured Supabase MCP in read-only mode as the authoritative data source. CSVs in `resources/` are for the initial learning exercise only; do not use them anymore.
- Follow [.github/instructions/dashboard.instructions.md](.github/instructions/dashboard.instructions.md) for privacy, source-table validation, join-cardinality checks, snapshot requirements, and publishing rules.
- Before presenting results, check missing values, referential integrity, anomalous values, and limitations that could affect KPI reliability.

## Business KPIs

When relevant, prioritize metrics such as:

- Revenue
- Margin %
- Average Ticket
- Sales by Channel
- Sales by Category
- Conversion
- Units Sold

## Data Quality

Before presenting results:

- Validate null or missing values.
- Check referential integrity across dimension tables.
- Detect anomalous values, including unusual price drops and potential stock issues.
- Explain any limitations that may affect the reliability of the analysis.

## Validation

- Run `node evals/harness.js` after changing dashboard calculations; it checks the Total Sales month-over-month scenarios without a browser or extra packages.
- For visual or interaction changes, serve the repository locally and inspect the dashboard in a browser. See [README.md](README.md#essential-commands) for the Windows and Unix-like commands.
- This repository has no general build or package-install step. Follow the relevant exercise in [docs/](docs/) for its documented workflow.

## Agent Resources

- Use `frontend-design` for interface and visual-design decisions: [.agents/skills/frontend-design/SKILL.md](.agents/skills/frontend-design/SKILL.md).
- Use `kpi-dashboard-design` for KPI selection, metric consistency, and dashboard visualization: [.agents/skills/kpi-dashboard-design/SKILL.md](.agents/skills/kpi-dashboard-design/SKILL.md).
- The configured `supabase` and `confluence` MCP servers are documented in [.vscode/mcp.json](.vscode/mcp.json). Use MCPs for authorized external data or publishing actions; use skills for domain guidance. Never copy credentials from MCP configuration into source files or chat.
- OpenSpec requirements and changes live in [openspec/](openspec/); see [docs/exercises/exercise-04-sdd.md](docs/exercises/exercise-04-sdd.md) and [docs/exercises/exercise-05-implementation-evals.md](docs/exercises/exercise-05-implementation-evals.md) for the documented workflow.