param(
    [Parameter(Mandatory)][string]$WebViewPackage,
    [Parameter(Mandatory)][string]$BuildDirectory,
    [Parameter(Mandatory)][string]$InstallerPath,
    [Parameter(Mandatory)][string]$IpccArchive
)
$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
$framework = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319'
$compiler = Join-Path $framework 'csc.exe'
$libraries = Join-Path $WebViewPackage 'lib\net462'
$appFolder = Join-Path $BuildDirectory 'app'
$webFolder = Join-Path $appFolder 'www'
New-Item -ItemType Directory -Path $webFolder -Force | Out-Null
if (-not (Test-Path -LiteralPath $IpccArchive -PathType Leaf)) { throw 'IPCC archive was not found' }
$referenceFolder = Join-Path $appFolder 'references'
New-Item -ItemType Directory -Path $referenceFolder -Force | Out-Null
Copy-Item -LiteralPath $IpccArchive -Destination (Join-Path $referenceFolder 'IPCC.zip') -Force
$encoding = [Text.UTF8Encoding]::new($false)

function Read-Web([string]$name) { [IO.File]::ReadAllText((Join-Path $repo "dist\$name")) }
function Write-Web([string]$name, [string]$value) { [IO.File]::WriteAllText((Join-Path $webFolder $name), $value, $encoding) }

$index = (Read-Web 'index.html').Replace('<script src="app.js"></script>', '<script src="storage.js"></script><script src="app.js"></script><script src="exceljs.min.js"></script><script src="excel-model.js"></script><script src="excel-export.js"></script>')
$index = $index.Replace('<script src="app.js"></script>', '<script src="ipcc.js"></script><script src="ipcc-reader.js"></script><script src="factor-workbook-data.js"></script><script src="ipcc-fuel-data.js"></script><script src="factor-workbook.js"></script><script src="factor-templates.js"></script><script src="split-workspace.js"></script><script src="app.js"></script>').Replace('</head>', '<link rel="stylesheet" href="ipcc.css"><link rel="stylesheet" href="factor-workbook.css"><link rel="stylesheet" href="split-workspace.css"></head>')
$index = $index.Replace('<script src="app.js"></script>', '<script src="inventory-guide.js"></script><script src="app.js"></script>').Replace('</head>', '<link rel="stylesheet" href="inventory-guide.css"></head>')
Write-Web 'index.html' $index
foreach ($file in @('accounts.js','accounts.css','buttons.js','buttons.css','overview-hero.js','overview-hero.css','port-view.mp4','facility-report.js','facility-report.css','calorific.js','calorific-lab.js','calorific.css','inventory-guide.js','inventory-guide.css','Huong-dan-tinh-kiem-ke-khi-nha-kinh-Duyen-Hai-1.docx')) {
    Copy-Item -LiteralPath (Join-Path $repo "dist\$file") -Destination $webFolder -Force
}
$login = (Read-Web 'login.html').Replace('action="/login"', 'action="/login.html"')
$login = $login.Replace('<!-- login-error -->', '<p id="desktop-login-error" class="login-error" role="alert" hidden>Tài khoản hoặc mật khẩu chưa đúng.</p>')
$login = $login.Replace('<!-- account-links -->', '').Replace('</body>', '<script src="desktop-login.js"></script></body>')
Write-Web 'login.html' $login
Write-Web 'login.css' (Read-Web 'login.css')
Write-Web 'desktop-login.js' ([IO.File]::ReadAllText((Join-Path $PSScriptRoot 'login.js')))
Copy-Item -LiteralPath (Join-Path $repo 'dist\duyen-hai.png') -Destination $webFolder -Force
Write-Web 'style.css' ((Read-Web 'style.css') -replace '(?m)^@import[^\r\n]+\r?\n','')
Write-Web 'engine.js' (Read-Web 'engine.js')
Write-Web 'calculations.js' (Read-Web 'calculations.js')
Write-Web 'calculations.css' (Read-Web 'calculations.css')
Write-Web 'activities.js' (Read-Web 'activities.js')
Write-Web 'operations.css' (Read-Web 'operations.css')
Copy-Item -LiteralPath (Join-Path $repo 'dist\greenledger-brand.png') -Destination $webFolder -Force
Write-Web 'storage.js' ([IO.File]::ReadAllText((Join-Path $PSScriptRoot 'storage.js')))
foreach ($script in @('excel-model.js','excel-export.js')) { Write-Web $script ([IO.File]::ReadAllText((Join-Path $PSScriptRoot $script))) }
foreach ($file in @('ipcc.js','ipcc-reader.js','ipcc.css','ipcc-index.json')) { Copy-Item -LiteralPath (Join-Path $PSScriptRoot $file) -Destination $webFolder -Force }
foreach ($file in @('factor-workbook-data.js','ipcc-fuel-data.js','factor-workbook.js','factor-workbook.css','factor-templates.js','split-workspace.js','split-workspace.css')) { Copy-Item -LiteralPath (Join-Path $PSScriptRoot $file) -Destination $webFolder -Force }
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'vendor\pdfjs') -Destination $webFolder -Recurse -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'vendor\exceljs.min.js') -Destination $webFolder -Force
$app = (Read-Web 'app.js').Replace('localStorage.', 'desktopStorage.').Replace('desktopStorage.setItem(KEY,raw)', 'desktopStorage.setItem(KEY,raw,revision)')
$app = $app.Replace("location.protocol === 'file:' ? '<span class=`"avatar`">GL</span>' : '<a class=`"avatar account-entry`" href=`"/login.html`" aria-label=`"Tài khoản`" title=`"Tài khoản`">GL</a>'", "'<span class=`"avatar`">GL</span>'")
$app = $app.Replace('Tự động lưu trên thiết bị', 'Tự động lưu trên laptop').Replace('Dữ liệu trên trình duyệt có thể mất khi xóa bộ nhớ trang.', 'Tệp số liệu nằm trong Tệp → Mở thư mục dữ liệu.').Replace('Ứng dụng tính và lưu cục bộ trên trình duyệt, không đồng bộ hồ sơ giữa các thiết bị. Bản tải về có thể chạy bằng cách mở index.html. Nên giữ bản sao lưu JSON định kỳ.', 'Ứng dụng lưu số liệu trên laptop này. Dùng bản sao lưu JSON để chuyển dữ liệu sang máy khác.')
$app = $app.Replace('Dữ liệu lưu trên trình duyệt', 'Dữ liệu lưu trên laptop').Replace("if(file.size>10*1024*1024)throw Error('Tệp quá lớn (tối đa 10 MB)');", '')
$app = $app.Replace('Phiên bản 1.0', 'Phiên bản 1.24')
$app = $app.Replace("case'new-factor':factorDialog();break;", "case'new-factor':openFactorTemplate();break;")
$app = $app.Replace("let x=old|| (library==='fuels'?", "let x=old||preset|| (library==='fuels'?")
$app = $app.Replace('E.seed()', 'mergeIpccFuels(mergeWorkbookFactors(E.seed()))')
$app = $app.Replace('db=raw?JSON.parse(raw):', 'db=raw?mergeWorkbookFactors(JSON.parse(raw)):')
$app = $app.Replace('let next=JSON.parse(await file.text());', 'let next=mergeIpccFuels(mergeWorkbookFactors(JSON.parse(await file.text())));')
$app = $app.Replace('function factors(){', 'function factors(){if(workbookView.reference)return factorWorkbookPage();')
$app = $app.Replace('value="${v}" required', 'value="${v??''''}" required')
$app = $app.Replace('type="number" min="0" step="any" value="${v??''''}" required', 'type="number" min="${k===''ncv''&&i===0&&x.id===''IPCC22_INDUSTRIAL_WASTE''?''0.000001'':0}" step="any" value="${v??''''}" required')
$app = $app.Replace('<td>${n(x.co2[0],0)} / ${n(x.ch4[0],2)} / ${n(x.n2o[0],2)}<span class="annual-number">kg/TJ · KLR ${n(x.density,3)} kg/${esc(x.unit)}</span></td>', '${fuelEmissionCell(x)}')
$app = $app.Replace('includes(filter.toLowerCase()));return `<section class="panel">', 'includes(filter.toLowerCase()));const pending=pendingIpccFuelRow();return `<section class="panel">')
$app = $app.Replace('</tr>`).join('''')}</tbody></table></div>${!rows.length?''<p class="empty">Không tìm thấy hệ số.', '</tr>`).join('''')}${pending}</tbody></table></div>${!rows.length&&!pending?''<p class="empty">Không tìm thấy hệ số.')
$app = $app.Replace('<p class="table-caption">Thay đổi hệ số', '${library===''fuels''?''<p class="table-caption">Quy đổi theo đơn vị nhập = EF × NCV × kg/đơn vị nhập ÷ 1.000.000. Kết quả là kg của từng khí.</p>'':''''}<p class="table-caption">Thay đổi hệ số')
$app = $app.Replace('<div class="toolbar"><input id="search"', '<div class="toolbar">${factorWorkbookToggle()}<input id="search"')
$app = $app.Replace("'Sao lưu & xuất dữ liệu'];", "'Sao lưu & xuất dữ liệu','Tra cứu IPCC'];")
$app = $app.Replace("'Giữ một bản dữ liệu độc lập trên thiết bị của bạn.'][tab]", "'Giữ một bản dữ liệu độc lập trên thiết bị của bạn.','Tìm và xem bảng tham chiếu IPCC ngay trong ứng dụng.'][tab]")
$app = $app.Replace('${btn(''Xuất báo cáo'',''go-report'',''primary'')}', '${tab===6?'''':btn(''Xuất báo cáo'',''go-report'',''primary'')}')
$app = $app.Replace('<section class="period-strip">','<section class="period-strip" ${tab===6&&!splitWorkspaceVisible()?''hidden'':''''}>')
$app = $app.Replace('${tab===0?dashboard(s):tab===1?activities(s):tab===2?calculations(s):tab===3?reports(s):tab===4?factors():backup(s)}', '${desktopWorkspace(s,tab===0?dashboard(s):tab===1?activities(s):tab===2?calculations(s):tab===3?reports(s):tab===4?factors():tab===6?ipccPage():backup(s))}')
$app = $app.Replace('${pageOptions()}', '${pageOptions()}${splitWorkspaceToggle()}')
$app = $app.Replace('function render(){let s=', 'function render(){const splitScroll=captureSplitScroll();let s=')
$app = $app.Replace('footer></main></div></div>`;mountOverviewModel();}', 'footer></main></div></div>`;restoreSplitScroll(splitScroll);mountOverviewModel();}')
$app = $app.Replace("'Tra cứu IPCC'];", "'Tra cứu IPCC','Hướng dẫn kiểm kê'];")
$app = $app.Replace("'Tìm và xem bảng tham chiếu IPCC ngay trong ứng dụng.'][tab]", "'Tìm và xem bảng tham chiếu IPCC ngay trong ứng dụng.','Công thức, ví dụ tính và các bước lập báo cáo.'][tab]")
$app = $app.Replace('${tab===6?'''':btn(''Xuất báo cáo'',''go-report'',''primary'')}', '${tab===7?guideDownloadButton():tab===6?'''':btn(''Xuất báo cáo'',''go-report'',''primary'')}')
$app = $app.Replace("tab===6&&!splitWorkspaceVisible()?", "(tab===7||tab===6&&!splitWorkspaceVisible())?")
$app = $app.Replace('tab===6?ipccPage():backup(s)', 'tab===6?ipccPage():tab===7?inventoryGuide():backup(s)')
# Tab 8: Tài khoản & phân quyền (accounts.js).
$app = $app.Replace("'Tra cứu IPCC','Hướng dẫn kiểm kê'];", "'Tra cứu IPCC','Hướng dẫn kiểm kê','Tài khoản & phân quyền'];")
$app = $app.Replace("'Công thức, ví dụ tính và các bước lập báo cáo.'][tab]", "'Công thức, ví dụ tính và các bước lập báo cáo.','Đổi mật khẩu, cấp tài khoản và phân quyền theo nhiệm vụ.'][tab]")
$app = $app.Replace('${tab===7?guideDownloadButton():tab===6?''''', '${tab===7?guideDownloadButton():tab===6||tab===8?''''')
$app = $app.Replace('(tab===7||tab===6&&!splitWorkspaceVisible())?', '(tab===7||tab===8||tab===6&&!splitWorkspaceVisible())?')
$app = $app.Replace('tab===7?inventoryGuide():backup(s)', 'tab===7?inventoryGuide():tab===8?accountsPage():backup(s)')
if ($app.Contains('/login.html') -or $app.Contains('localStorage.')) { throw 'Desktop adaptation failed' }
$app = $app.TrimEnd() + "`n" + 'if (revision !== null && !storageError && db.ipccFuelLibraryVersion !== 1) change(mergeIpccFuels, ''Đã cập nhật thư viện nhiên liệu IPCC'');'
Write-Web 'app.js' $app

$core = Join-Path $libraries 'Microsoft.Web.WebView2.Core.dll'
$forms = Join-Path $libraries 'Microsoft.Web.WebView2.WinForms.dll'
Copy-Item -LiteralPath $core,$forms,(Join-Path $WebViewPackage 'runtimes\win-x64\native\WebView2Loader.dll') -Destination $appFolder -Force
$notice = Join-Path $WebViewPackage 'LICENSE.txt'
if (Test-Path -LiteralPath $notice) { Copy-Item -LiteralPath $notice -Destination (Join-Path $appFolder 'WebView2-LICENSE.txt') -Force }
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'vendor\ExcelJS-LICENSE.txt') -Destination $appFolder -Force

$exe = Join-Path $appFolder 'GreenLedger.exe'
$icon = Join-Path $PSScriptRoot 'greenledger.ico'
$manifest = Join-Path $PSScriptRoot 'windows.manifest'
& $compiler /nologo /codepage:65001 /target:winexe /platform:x64 /optimize+ "/win32icon:$icon" "/win32manifest:$manifest" "/out:$exe" "/reference:$core" "/reference:$forms" /reference:System.IO.Compression.dll /reference:System.IO.Compression.FileSystem.dll /reference:System.Web.Extensions.dll (Join-Path $PSScriptRoot 'GreenLedger.cs') (Join-Path $PSScriptRoot 'Accounts.cs')
if ($LASTEXITCODE -ne 0) { throw 'GreenLedger compilation failed' }

$payload = Join-Path $BuildDirectory 'app.zip'
Compress-Archive -Path (Join-Path $appFolder '*') -DestinationPath $payload -Force
& $compiler /nologo /codepage:65001 /target:winexe /platform:x64 /optimize+ "/win32icon:$icon" "/win32manifest:$manifest" "/out:$InstallerPath" "/resource:$payload,GreenLedger.Payload" /reference:System.IO.Compression.dll /reference:System.IO.Compression.FileSystem.dll /reference:Microsoft.CSharp.dll (Join-Path $PSScriptRoot 'Setup.cs')
if ($LASTEXITCODE -ne 0) { throw 'Installer compilation failed' }
