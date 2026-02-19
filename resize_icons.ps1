Add-Type -AssemblyName System.Drawing

$srcPath = 'C:\Users\Administrator\.gemini\antigravity\brain\1dd71c5b-ee59-4c29-a642-13b8b1a3172a\uploaded_media_1771497998238.png'
$resDir = 'android\app\src\main\res'

$sizes = @{
    'mipmap-ldpi'    = 36
    'mipmap-mdpi'    = 48
    'mipmap-hdpi'    = 72
    'mipmap-xhdpi'   = 96
    'mipmap-xxhdpi'  = 144
    'mipmap-xxxhdpi' = 192
}

$src = [System.Drawing.Image]::FromFile($srcPath)

foreach ($folder in $sizes.Keys) {
    $size = $sizes[$folder]
    $destFolder = Join-Path $resDir $folder

    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.DrawImage($src, 0, 0, $size, $size)
    $g.Dispose()

    $bmp.Save((Join-Path $destFolder 'ic_launcher.png'), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Save((Join-Path $destFolder 'ic_launcher_round.png'), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Save((Join-Path $destFolder 'ic_launcher_foreground.png'), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()

    Write-Host "Done: $folder ($size x $size)"
}

$src.Dispose()

# Save large version to assets
$srcFull = [System.Drawing.Image]::FromFile($srcPath)
$bmpLarge = New-Object System.Drawing.Bitmap(1024, 1024)
$gL = [System.Drawing.Graphics]::FromImage($bmpLarge)
$gL.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gL.DrawImage($srcFull, 0, 0, 1024, 1024)
$gL.Dispose()
$srcFull.Dispose()
$bmpLarge.Save('assets\icon.png', [System.Drawing.Imaging.ImageFormat]::Png)
$bmpLarge.Dispose()

Write-Host "Done: assets/icon.png (1024x1024)"
Write-Host "All icons replaced successfully!"
