Add-Type -AssemblyName System.Drawing

$srcPath = 'C:\Users\Administrator\.gemini\antigravity\brain\1dd71c5b-ee59-4c29-a642-13b8b1a3172a\uploaded_media_1771499782348.png'
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
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.DrawImage($src, 0, 0, $size, $size)
    $g.Dispose()

    $bmp.Save((Join-Path $destFolder 'ic_launcher.png'), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Save((Join-Path $destFolder 'ic_launcher_round.png'), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Save((Join-Path $destFolder 'ic_launcher_foreground.png'), [System.Drawing.Imaging.ImageFormat]::Png)
    # Also replace background with white (clean look)
    $bmpBg = New-Object System.Drawing.Bitmap($size, $size)
    $gBg = [System.Drawing.Graphics]::FromImage($bmpBg)
    $gBg.Clear([System.Drawing.Color]::White)
    $gBg.Dispose()
    $bmpBg.Save((Join-Path $destFolder 'ic_launcher_background.png'), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmpBg.Dispose()
    $bmp.Dispose()

    Write-Host "Done: $folder ($size x $size)"
}

$src.Dispose()

# Also update public/logo.png and assets/icon.png with this image (1024x1024)
$sizes2 = @{
    'public\logo.png'     = 1024
    'assets\icon.png'     = 1024
    'public\sbh_icon.png' = 512
}

foreach ($outPath in $sizes2.Keys) {
    $sz = $sizes2[$outPath]
    $srcFull = [System.Drawing.Image]::FromFile($srcPath)
    $bmpL = New-Object System.Drawing.Bitmap($sz, $sz)
    $gL = [System.Drawing.Graphics]::FromImage($bmpL)
    $gL.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gL.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gL.DrawImage($srcFull, 0, 0, $sz, $sz)
    $gL.Dispose()
    $srcFull.Dispose()
    $bmpL.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmpL.Dispose()
    Write-Host "Updated: $outPath ($sz x $sz)"
}

Write-Host ""
Write-Host "All icons replaced with new SBH logo!"
