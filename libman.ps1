$array = @(
    [PSCustomObject]@{
        URL = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/fonts/bootstrap-icons.woff";
        Path = "css/fonts";
        OutFile = "bootstrap-icons.woff";
    },
    [PSCustomObject]@{
        URL = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/fonts/bootstrap-icons.woff2";
        Path = "css/fonts";
        OutFile = "bootstrap-icons.woff2";
    },
    [PSCustomObject]@{
        URL = "https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/fonts/fontawesome-webfont.woff";
        Path = "fonts";
        OutFile = "fontawesome-webfont.woff";
    },
    [PSCustomObject]@{
        URL = "https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/fonts/fontawesome-webfont.woff2";
        Path = "fonts";
        OutFile = "fontawesome-webfont.woff2";
    },
    [PSCustomObject]@{
        URL = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js";
        Path = "bootstrap/js";
        OutFile = "bootstrap.bundle.min.js";
    },
    [PSCustomObject]@{
        URL = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css";
        Path = "font-awesome/css";
        OutFile = "all.min.css";
    },
    [PSCustomObject]@{
        URL = "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js";
        Path = "jquery/js";
        OutFile = "jquery.min.js";
    },
    [PSCustomObject]@{
        URL = "https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.14.1/jquery-ui.min.js";
        Path = "jquery/js";
        OutFile = "jquery-ui.min.js";
    }
)

$currentDirectory = Get-Location
$array | ForEach-Object {
     $combined = "$currentDirectory/public/lib/$($_.Path)"
     New-Item -Path $combined -ItemType Directory -Force
     Invoke-WebRequest -Uri $_.URL -OutFile "$combined/$($_.OutFile)" -UseBasicParsing
}
