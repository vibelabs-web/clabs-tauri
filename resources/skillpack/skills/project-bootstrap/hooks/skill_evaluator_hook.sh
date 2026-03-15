#!/bin/bash
# Skill Evaluator Hook
# Runs on UserPromptSubmit to auto-match skills to user prompts

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_EVALUATOR="${SCRIPT_DIR}/../scripts/skill_evaluator.py"

# Read the prompt from stdin (Claude Code passes it this way)
PROMPT=$(cat)

# Skip if empty
if [ -z "$PROMPT" ]; then
    exit 0
fi

# Run skill evaluator
if [ -f "$SKILL_EVALUATOR" ]; then
    MATCHES=$(echo "$PROMPT" | python3 "$SKILL_EVALUATOR" --format json --top 3 2>/dev/null)

    if [ $? -eq 0 ] && [ -n "$MATCHES" ]; then
        # Check if any matches found
        COUNT=$(echo "$MATCHES" | python3 -c "import json,sys; data=json.load(sys.stdin); print(len(data))" 2>/dev/null)

        if [ "$COUNT" -gt 0 ]; then
            # Output skill suggestions (will be shown to user)
            NAMES=$(echo "$MATCHES" | python3 -c "import json,sys; data=json.load(sys.stdin); print(', '.join([d['name'] for d in data]))" 2>/dev/null)
            echo "⚡ 매칭된 스킬: $NAMES"
        fi
    fi
fi

exit 0
