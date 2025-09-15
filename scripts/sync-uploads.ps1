<#
Simple PowerShell helper to add/commit (and optionally push) changes under public/uploads.
Usage:
  .\scripts\sync-uploads.ps1          # dry-run: shows files and creates commit locally but does NOT push
  .\scripts\sync-uploads.ps1 -Push    # commit and push to current branch
  .\scripts\sync-uploads.ps1 -Push -Branch "my-branch"  # push to specified branch

Notes:
- By default this script commits only files under public/uploads.
- It will exit if there are no changes.
- Run from repository root (the script will `Set-Location` to its folder automatically).
#>

param(
  [switch]$Push,
  [string]$Branch = ""
)

# Change to repository root (script folder assumed inside repo)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

$target = "public/uploads"

if (-not (Test-Path $target)) {
  Write-Host "Directory not found: $target" -ForegroundColor Yellow
  exit 1
}

# Get porcelain status for target
$changes = git status --porcelain $target 2>$null

if (-not $changes) {
  Write-Host "No changes found in $target" -ForegroundColor Green
  exit 0
}

# Parse file paths from porcelain output (skip the two-char status + space)
$files = @()
foreach ($line in $changes) {
  if ($line.Length -ge 4) {
    $files += $line.Substring(3)
  } else {
    $files += $line.Trim()
  }
}

$filesCount = $files.Count
$now = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

$branchName = $Branch
if (-not $branchName) {
  $branchName = git rev-parse --abbrev-ref HEAD
}

$commitMessage = "chore: sync uploads ($filesCount files) $now"

Write-Host "Found $filesCount changed files under $target:" -ForegroundColor Cyan
$files | ForEach-Object { Write-Host " - $_" }
Write-Host "`nCommit message:`n$commitMessage`n" -ForegroundColor Gray

# Stage and commit
git add -- $target

try {
  git commit -m "$commitMessage"
} catch {
  Write-Host "git commit failed or nothing to commit." -ForegroundColor Yellow
  Write-Host $_.Exception.Message
  exit 1
}

if ($Push) {
  Write-Host "Pushing to origin/$branchName..." -ForegroundColor Cyan
  git push origin $branchName
  if ($LASTEXITCODE -eq 0) {
    Write-Host "Push successful." -ForegroundColor Green
  } else {
    Write-Host "Push failed. Check git output above." -ForegroundColor Red
  }
} else {
  Write-Host "Commit created locally. Re-run with -Push to push to remote branch $branchName." -ForegroundColor Yellow
}
