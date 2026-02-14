# Troubleshooting

## gh CLI

### Not installed

```bash
# macOS
brew install gh

# Linux (Debian/Ubuntu)
sudo apt install gh

# Linux (Fedora)
sudo dnf install gh

# Other
# https://cli.github.com/
```

### Not authenticated

```bash
gh auth login
# Follow prompts, select GitHub.com, HTTPS, browser auth
```

### Rate limited

```bash
gh api rate_limit --jq '.rate'
# Wait for reset, or authenticate for higher limits
```

### 403 Forbidden

Missing write permissions. Ensure:

- Token has `repo` scope (check: `gh auth status`)
- You have push access to the repository
- Branch protection allows your role

### 404 Not Found

Repository doesn't exist or isn't accessible. Check:

- `git remote get-url origin` shows correct repo
- You have read access

## Git Issues

### Dirty working tree

```bash
# See what's changed
git status

# Stash changes temporarily
git stash

# Or commit everything
git add -A && git commit -m "pre-release cleanup"
```

### Tag already exists

```bash
# Check existing tags
git tag -l "v1.2.*"

# Delete local tag
git tag -d v1.2.3

# Delete remote tag
git push origin --delete v1.2.3

# Or choose a different version
```

### Not on default branch

```bash
git checkout main
git pull origin main
```

### Behind remote

```bash
git pull --rebase origin main
```

## CI Issues

### CI not passing

```bash
# Check recent runs
gh run list --limit 5

# View failing run
gh run view <run-id> --log-failed
```

Do NOT release with failing CI. Fix failures first.

### No CI configured

If no CI exists, manually run all quality gates:

1. Run tests locally
2. Run build locally
3. Verify on a clean checkout if possible

## Release Issues

### Workflow not triggering

```bash
# Verify workflow exists and is enabled
gh workflow list

# Check workflow file
cat .github/workflows/release.yml

# Ensure workflow_dispatch trigger exists
grep "workflow_dispatch" .github/workflows/release.yml
```

### Release created but package not published

Check workflow logs:

```bash
gh run list --workflow=release.yml --limit 1
gh run view <run-id> --log
```

Common causes:

- Missing `NODE_AUTH_TOKEN` or equivalent secret
- Registry authentication failure
- Package name conflict
