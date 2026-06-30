$ErrorActionPreference = 'Stop'
$scriptPath = 'E:\web2026\netlify-lms2026\script.js'
$content = Get-Content -Path $scriptPath -Encoding UTF8

if ($content.Length -lt 4300) {
    Write-Host Error
    exit 1
}

$teacherCore = $content[0..287]
$studentDash = $content[288..1135]
$admin = $content[1136..1508]
$examBuilder = $content[1509..1811]
$tools = $content[1812..2720]
$aiBuddy = $content[2721..2825]
$teacherActions = $content[2826..($content.Length-1)]

Set-Content -Path 'E:\web2026\netlify-lms2026\teacher-core.js' -Value $teacherCore -Encoding UTF8
Set-Content -Path 'E:\web2026\netlify-lms2026\student-dash.js' -Value $studentDash -Encoding UTF8
Set-Content -Path 'E:\web2026\netlify-lms2026\admin.js' -Value $admin -Encoding UTF8
Set-Content -Path 'E:\web2026\netlify-lms2026\exam-builder.js' -Value $examBuilder -Encoding UTF8
Set-Content -Path 'E:\web2026\netlify-lms2026\tools.js' -Value $tools -Encoding UTF8
Set-Content -Path 'E:\web2026\netlify-lms2026\ai-buddy.js' -Value $aiBuddy -Encoding UTF8
Set-Content -Path 'E:\web2026\netlify-lms2026\teacher-actions.js' -Value $teacherActions -Encoding UTF8
Set-Content -Path $scriptPath -Value '// Done' -Encoding UTF8

Write-Host Success
