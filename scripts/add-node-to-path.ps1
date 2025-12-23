# Script para adicionar Node.js ao PATH permanentemente
# Execute como Administrador: .\scripts\add-node-to-path.ps1

$nodePath = "C:\Program Files\nodejs"
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")

if ($currentPath -notlike "*$nodePath*") {
    Write-Host "Adicionando Node.js ao PATH do usuário..." -ForegroundColor Yellow
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$nodePath", "User")
    Write-Host "✅ Node.js adicionado ao PATH!" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANTE: Feche e reabra o PowerShell para aplicar as mudanças." -ForegroundColor Yellow
} else {
    Write-Host "✅ Node.js já está no PATH!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Verificando instalação..." -ForegroundColor Cyan
& "$nodePath\node.exe" --version
& "$nodePath\npm.cmd" --version

