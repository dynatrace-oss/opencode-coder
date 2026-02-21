#!/usr/bin/env bash
# collect-system-info.sh
# Collects system information for bug reports
# Note: AI assistants use the coder tool instead for richer information

set -euo pipefail

echo "=== System Information ==="
echo ""

# OS Info
echo "Operating System: $(uname -s) $(uname -r)"

# Node.js
echo "Node.js: $(node --version 2>/dev/null || echo 'NOT FOUND')"

# npm
echo "npm: $(npm --version 2>/dev/null || echo 'NOT FOUND')"

# bd CLI
echo "bd CLI: $(bd --version 2>&1 || echo 'NOT FOUND')"

# Current directory
echo "Working Directory: $(pwd)"

# Beads status
if [ -d ".beads" ]; then
    echo "Beads: initialized"
    echo "  Mode: $(cat .beads/config.yaml 2>/dev/null | grep mode || echo 'unknown')"
    echo "  Doctor output:"
    bd doctor 2>&1 | head -5 | sed 's/^/    /' || true
else
    echo "Beads: not initialized"
fi

echo ""
echo "=== End ==="
echo ""
echo "Note: For AI-assisted bug reports, the assistant uses the coder tool"
echo "which provides more detailed information automatically."
