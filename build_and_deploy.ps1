$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontend = Join-Path $root 'frontend'
$dist = Join-Path $frontend 'dist'
$target = Join-Path $root 'backend\internship_completion\static\src\frontend'

Push-Location $frontend
try {
    npm run build
}
finally {
    Pop-Location
}

if (-not (Test-Path $dist)) {
    throw "Frontend build output was not created: $dist"
}

if (Test-Path $target) {
    Remove-Item $target -Recurse -Force
}
New-Item -ItemType Directory -Path $target -Force | Out-Null
Copy-Item (Join-Path $dist '*') $target -Recurse -Force

Write-Host "Internship frontend deployed to $target"
