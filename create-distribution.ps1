# 📦 Distribution Package Script
# Creates a distributable package for sharing with other developers

# Create distribution directory
$distDir = "mcp-earthquake-server-dist"
if (Test-Path $distDir) {
    Remove-Item -Recurse -Force $distDir
}
New-Item -ItemType Directory -Name $distDir

# Copy essential files
Copy-Item "dist" -Destination "$distDir/dist" -Recurse
Copy-Item "src" -Destination "$distDir/src" -Recurse
Copy-Item "package.json" -Destination $distDir
Copy-Item "tsconfig.json" -Destination $distDir
Copy-Item "README.md" -Destination $distDir
Copy-Item "DEVELOPER-SETUP.md" -Destination $distDir
Copy-Item "CODE-REVIEW-SUMMARY.md" -Destination $distDir

# Copy test files
Copy-Item "test-*.js" -Destination $distDir

# Create .gitignore
@"
node_modules/
.env
*.log
.DS_Store
Thumbs.db
"@ | Out-File -FilePath "$distDir/.gitignore" -Encoding utf8

# Create LICENSE file
@"
MIT License

Copyright (c) 2025 MCP Earthquake Server Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
"@ | Out-File -FilePath "$distDir/LICENSE" -Encoding utf8

Write-Host "Distribution package created in $distDir/" -ForegroundColor Green
Write-Host "Ready to share with other developers!" -ForegroundColor Cyan
