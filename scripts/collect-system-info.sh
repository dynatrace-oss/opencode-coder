#!/usr/bin/env bash
# collect-system-info.sh
# Collects system information for bug reports

set -euo pipefail

echo "=== OpenCode Coder Plugin - System Information ==="
echo ""

# Operating System
echo "Operating System:"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        echo "  $NAME $VERSION"
    else
        echo "  Linux (unknown distribution)"
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "  macOS $(sw_vers -productVersion)"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    echo "  Windows"
else
    echo "  Unknown: $OSTYPE"
fi
echo ""

# Node.js version
echo "Node.js Version:"
if command -v node &> /dev/null; then
    echo "  $(node --version)"
else
    echo "  NOT FOUND"
fi
echo ""

# npm version
echo "npm Version:"
if command -v npm &> /dev/null; then
    echo "  $(npm --version)"
else
    echo "  NOT FOUND"
fi
echo ""

# bd CLI version
echo "bd CLI Version:"
if command -v bd &> /dev/null; then
    bd --version 2>&1 | sed 's/^/  /'
else
    echo "  NOT FOUND"
fi
echo ""

# Plugin version
echo "Plugin Version:"
if [ -f "package.json" ]; then
    if command -v jq &> /dev/null; then
        version=$(jq -r '.dependencies["opencode-coder"] // .devDependencies["opencode-coder"] // "NOT FOUND"' package.json)
        echo "  $version"
    else
        # Fallback without jq
        grep -A1 '"opencode-coder"' package.json | grep -oP '"\K[^"]+(?=")' | tail -1 || echo "  NOT FOUND (install jq for better detection)"
    fi
else
    echo "  NOT FOUND (no package.json in current directory)"
fi
echo ""

# Shell
echo "Shell:"
echo "  $SHELL"
echo ""

# Current directory
echo "Current Directory:"
echo "  $(pwd)"
echo ""

# Git status (if in a git repo)
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo "Git Repository:"
    echo "  Branch: $(git rev-parse --abbrev-ref HEAD)"
    echo "  Commit: $(git rev-parse --short HEAD)"
    echo ""
fi

# Check if .beads directory exists
if [ -d ".beads" ]; then
    echo "Beads Status:"
    echo "  .beads directory exists: YES"
    if command -v bd &> /dev/null; then
        echo "  bd doctor output:"
        bd doctor 2>&1 | sed 's/^/    /' || echo "    (bd doctor failed)"
    fi
    echo ""
fi

echo "=== End System Information ==="
echo ""
echo "Copy the above information into your bug report."
