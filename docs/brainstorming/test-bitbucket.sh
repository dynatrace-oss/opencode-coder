#!/bin/bash

# Simple Bitbucket API test
# Requires: BITBUCKET_TOKEN environment variable

if [ -z "$BITBUCKET_TOKEN" ]; then
    echo "❌ Error: BITBUCKET_TOKEN not set"
    exit 1
fi

echo "🔍 Testing Bitbucket API..."

curl -s -H "Authorization: Bearer $BITBUCKET_TOKEN" \
    "https://bitbucket.lab.dynatrace.org/rest/api/1.0/projects/PFS/repos/copilot-skills/pull-requests/2639" \
    | head -20

echo ""
echo "✅ Test complete"
