# ============================================================
#  push.ps1  —  One-click git push for the quiz portal
#  ------------------------------------------------------------
#  USAGE:
#    1. Open PowerShell here (Shift + Right-click → "Open PowerShell window")
#    2. First time only:
#         .\push.ps1 -RemoteUrl "https://github.com/<your-username>/<repo>.git"
#    3. Every next push:
#         .\push.ps1 "your commit message"
# ============================================================

param(
    [string] $Message    = "",
    [string] $RemoteUrl  = ""
)

# Ensure we run from the script's folder
Set-Location -Path $PSScriptRoot

# ---- Check git is installed ----
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host ""
    Write-Host "ERROR: 'git' is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Install from: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# ---- Initialize repo if needed ----
if (-not (Test-Path ".git")) {
    Write-Host "Initialising new git repository..." -ForegroundColor Cyan
    git init | Out-Null
    git branch -M main
}

# ---- Configure remote ----
$existingRemote = ""
try { $existingRemote = (git remote get-url origin) 2>$null } catch {}

if ([string]::IsNullOrWhiteSpace($existingRemote)) {
    if ([string]::IsNullOrWhiteSpace($RemoteUrl)) {
        Write-Host ""
        Write-Host "No git remote set yet." -ForegroundColor Yellow
        Write-Host "Run once with:" -ForegroundColor Yellow
        Write-Host '   .\push.ps1 -RemoteUrl "https://github.com/<user>/<repo>.git"' -ForegroundColor White
        Write-Host ""
        exit 1
    }
    Write-Host "Setting remote origin -> $RemoteUrl" -ForegroundColor Cyan
    git remote add origin $RemoteUrl
} elseif (-not [string]::IsNullOrWhiteSpace($RemoteUrl) -and $RemoteUrl -ne $existingRemote) {
    Write-Host "Updating remote origin -> $RemoteUrl" -ForegroundColor Cyan
    git remote set-url origin $RemoteUrl
}

# ---- Stage everything ----
Write-Host "Staging changes..." -ForegroundColor Cyan
git add .

# Check if there's anything to commit
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "Nothing new to commit." -ForegroundColor Yellow
} else {
    if ([string]::IsNullOrWhiteSpace($Message)) {
        $Message = "Update quiz portal - " + (Get-Date -Format "yyyy-MM-dd HH:mm")
    }
    Write-Host "Committing: $Message" -ForegroundColor Cyan
    git commit -m $Message | Out-Null
}

# ---- Push ----
Write-Host "Pushing to origin/main..." -ForegroundColor Cyan
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "  Push successful! GitHub Actions will deploy the site." -ForegroundColor Green
    Write-Host "  Check progress: <your-repo-URL>/actions" -ForegroundColor Green
    Write-Host "  Site URL:       https://<user>.github.io/<repo>/" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Push failed. Check the error above." -ForegroundColor Red
    Write-Host "Common fixes:" -ForegroundColor Yellow
    Write-Host "  - Wrong remote URL? Run with -RemoteUrl '<correct-url>'" -ForegroundColor Yellow
    Write-Host "  - Not logged in? GitHub will prompt for credentials." -ForegroundColor Yellow
    Write-Host ""
}
