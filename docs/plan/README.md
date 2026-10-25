# Plan: bring RockHound-GO to "perfect"

Snapshot **2026-10-09** · trunk `main` @ `d59407e`. Every number in these documents was produced by a command listed in the [master plan, Appendix A](MASTER_PLAN.md#appendix-a-how-the-numbers-were-produced); nothing is estimated unless it says so.

| Read this | If you want to know |
| --- | --- |
| [**MASTER_PLAN.md**](MASTER_PLAN.md) | what we are doing and in what order, how three repos fit together, how we will know it is done, and which decisions are yours |
| [PR_BACKLOG_TRIAGE.md](PR_BACKLOG_TRIAGE.md) | what to do with the 152 open PRs and 170 branches (15 are verified safe to merge now) |
| [SECURITY_BACKLOG.md](SECURITY_BACKLOG.md) | verified security findings with `file:line`, a fix and a test for each |
| [FEATURE_LEDGER.md](FEATURE_LEDGER.md) | what is worth porting from `RockHound-GO_HUB` and `Ai-i-want-for-game`, and what to leave behind |

**Legend** · **✓** verified (ran it or read the code) · **~** inferred (reasoned, not executed) · **⚑** needs a decision, credential or GitHub setting only the owner has.

**The recommendation in one line:** make this repo the single trunk, mine the other two for specific features through a ledger, give them just enough hygiene to be safe, then archive them. Do not merge the repositories.

Related: [`RHGO_BUILD_DIRECTIVE.md`](../RHGO_BUILD_DIRECTIVE.md) · [`DISCOVERY_PSYCHOLOGY_LAYER.md`](../DISCOVERY_PSYCHOLOGY_LAYER.md) · the earlier audit in [`.github/audits/`](../../.github/audits/fable_omni_evolution_blueprint.md).
