#!/bin/bash
# Defense-in-Depth Hook
# Runs on PreToolUse (Bash) to auto-backup before dangerous commands

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFENSE_SCRIPT="${SCRIPT_DIR}/../scripts/defense_in_depth.py"

# Read the tool input from stdin (JSON format)
INPUT=$(cat)

# Extract command from JSON input
COMMAND=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(data.get('command', ''))
except:
    pass
" 2>/dev/null)

# Skip if no command
if [ -z "$COMMAND" ]; then
    exit 0
fi

# Run defense analysis
if [ -f "$DEFENSE_SCRIPT" ]; then
    RESULT=$(python3 "$DEFENSE_SCRIPT" --analyze-only --json "$COMMAND" 2>/dev/null)

    if [ $? -eq 0 ]; then
        RISK=$(echo "$RESULT" | python3 -c "import json,sys; print(json.load(sys.stdin).get('risk_level', 'SAFE'))" 2>/dev/null)

        case "$RISK" in
            "CRITICAL")
                echo "🛡️ CRITICAL 명령 감지: 백업 생성 + 확인 필요"
                python3 "$DEFENSE_SCRIPT" "$COMMAND"
                ;;
            "DANGEROUS")
                echo "🛡️ DANGEROUS 명령 감지: 자동 백업 생성"
                python3 "$DEFENSE_SCRIPT" "$COMMAND"
                ;;
            "MODERATE")
                echo "ℹ️ MODERATE 명령: 주의 필요"
                ;;
        esac
    fi
fi

exit 0
