# push-both.ps1
# Pushes commits to both repos with the correct author for each.
# Account A (sparsh-handa) → origin-a  | Author: Sparsh Handa
# Account B (avinajain03)  → origin-b  | Author: Avina Jain
# Usage: powershell -ExecutionPolicy Bypass -File ".\push-both.ps1"

$BRANCH = "master"
$ACCOUNT_B_NAME = "avinajain03"
$ACCOUNT_B_EMAIL = "avinajain03@gmail.com"
$TEMP_BRANCH = "accountB-push-temp"

Write-Host "`n>>> Pushing to Account A's repo (sparsh-handa)..." -ForegroundColor Cyan
git push origin-a $BRANCH
if ($LASTEXITCODE -ne 0) {
    Write-Host "Push to origin-a failed." -ForegroundColor Red; exit 1
}
Write-Host "Done." -ForegroundColor Green

Write-Host "`n>>> Rewriting author + committer as Account B (avinajain03)..." -ForegroundColor Cyan
git checkout -b $TEMP_BRANCH
$env:GIT_COMMITTER_NAME = $ACCOUNT_B_NAME
$env:GIT_COMMITTER_EMAIL = $ACCOUNT_B_EMAIL
git commit --amend --author="$ACCOUNT_B_NAME <$ACCOUNT_B_EMAIL>" --no-edit
Remove-Item Env:GIT_COMMITTER_NAME
Remove-Item Env:GIT_COMMITTER_EMAIL

Write-Host "`n>>> Pushing to Account B's repo (avinajain03)..." -ForegroundColor Cyan
git push --force origin-b "${TEMP_BRANCH}:${BRANCH}"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Push to origin-b failed." -ForegroundColor Red
    git checkout $BRANCH; git branch -D $TEMP_BRANCH; exit 1
}
Write-Host "Done." -ForegroundColor Green

Write-Host "`n>>> Cleaning up..." -ForegroundColor Cyan
git checkout $BRANCH
git branch -D $TEMP_BRANCH

Write-Host "`nAll done! Both repos are in sync." -ForegroundColor Green
Write-Host "  sparsh-handa/Expense_Tracker --> author: Sparsh Handa"
Write-Host "  avinajain03/Expense_Tracker  --> author: Avina Jain"
