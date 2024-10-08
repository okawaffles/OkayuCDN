let warning = false;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function doInfo(filesize, filetype, user, name) {
    const type = getFileTypeDesc(filetype);
    const size = formatSize(filesize);

    document.getElementById('type').innerHTML = `${type}`;
    document.getElementById('download').innerText = `Download (${size})`;

    processPreview(filetype, `/@${user}/${name}`);

    if (warning) {
        document.getElementById('warning').style.display = 'initial';
    }
}

function formatSize(bytes) {
    let fsize = '';
    if (bytes > 750*1024*1024)
        fsize = (((bytes / 1024) / 1024) / 1024).toFixed(2) + 'GB';
    else if (bytes > 750*1024)
        fsize = ((bytes / 1024) / 1024).toFixed(2) + 'MB';
    else if (bytes > 1024)
        fsize = (bytes / 1024).toFixed(2) + 'KB';
    else
        fsize = `${bytes}B`;

    return fsize;
}

let knownFileTypes = {
    'PNG': 'Image / Portable Network Graphic (PNG)',
    'JPG': 'Image (JPG)',
    'JPEG': 'Image (JPEG)',
    'WEBP': 'Image (WEBP)',
    'PSD': 'Photoshop Document (PSD)',
    'HEIC': 'Image / High Efficiency Image Container (HEIC)',
    'BMP': 'Image / Bitmap Graphic (BMP)',
    'ICO': 'Image / Icon (ICO)',
    'SVG': 'Image / Scalable Vector Graphic (SVG)',
    'PDN': 'paint.net Document (PDN)',
    'TGA': 'Image / Texture File (TGA)',

    'MP4': 'Video (MP4)',
    'MOV': 'Video (MOV)',
    'GIF': 'Image (GIF)',
    'MKV': 'Video / Mastroska (MKV)',
    'WEBM': 'Video (WEBM)',
    'AEP': 'After Effects Project (AEP)',
    'VEADOMINI': 'veadotube mini Avatar (VEADOMINI)',


    'MP3': 'Audio (MP3)',
    'FLAC': 'Lossless Audio (FLAC)',
    'WAV': 'Audio / Microsoft Wave File (WAV)',
    'OGG': 'Ogg Vorbis Audio File (OGG)',
    'FLP': 'FL Studio Project File (FLP)',
    'ALS': 'Ableton Live Project File (ALS)',
    'VSQ': 'Vocaloid Project File (VSQ)',


    'EXE': 'Windows Executable (EXE)',
    'MSI': 'Windows Installer (MSI)',
    'DMG': 'MacOS Installer (DMG)',
    'BAT': 'Windows Batch File (BAT)',
    'CMD': 'Windows Batch File (CMD)',
    'ISO': 'Disk Image (ISO)',
    'DLL': 'Dynamic Link Library (DLL)',
    'LIB': 'Object File Library (LIB)',
    'CUR': 'Cursor File (CUR)',
    'INF': 'Setup Information (INF)',
    'JAR': 'Java / Executable JAR File (JAR)',
    'APK': 'Android Installable App Package (APK)',
    'IPA': 'iOS Installable App Package (IPA)',
    'BIN': 'Binary File (BIN)',
    'CFG': 'Configuration File (CFG)',

    'PDF': 'Document (PDF)',
    'TXT': 'Text File (TXT)',
    'PPTX': 'Microsoft PowerPoint Document (PPTX)',
    'DOCX': 'Microsoft Word Document (DOCX)',
    'STORY': 'NovelAI Story (STORY)',
    'NAITHEME': 'NovelAI Theme (NAITHEME)',

    'HTML': 'Webpage (HTML)',
    'HTM': 'Webpage (HTM)',
    'JS': 'JavaScript File (JS)',
    'TS': 'TypeScript File (TS)',
    'EJS': 'Embedded JavaScript Webpage (EJS)',
    'JSON': 'JavaScript Object Notation (JSON)',
    'GITIGNORE': 'Git Ignore File',
    'MD': 'Markdown File (MD)',
    'MARKDOWN': 'Markdown File (MARKDOWN)',
    'CSS': 'Cascading Stylesheet (CSS)',
    'YAML': 'YAML File (YAML)',
    'YML': 'YAML File (YML)',
    'MAKEFILE':'Makefile',
    'JAVA': 'Java / Java Source File (JAVA)',
    'CLASS': 'Java / Java Class File (CLASS)',
    'XML': 'Extensible Markup Language (XML)',
    'VSIX': 'Microsoft Visual Studio Extension (VSIX)',
    'VCXPROJ': 'Microsoft Visual Studio Project File (VCXPROJ)',
    'SLN': 'Microsoft Visual Studio Solution (SLN)',
    'GD': 'Godot GDScript File (GD)',
    'GODOT': 'Godot Project File (GODOT)',
    'LICENSE': 'License File (LICENSE)',
    'REG': 'Windows Registry File (REG)',


    'VTT': 'Subtitles (VTT)',
    'ASS': 'Subtitles (ASS)',

    'TTF': 'TrueType Font (TTF)',
    'OTF': 'Font (OTF)',

    'VP1': 'VanillaPack Gen 1 Package (VP1)',
    'ZIP': 'Compressed Files (ZIP)',
    'RAR': 'Compressed Files (RAR)',
    'TAR': 'Compressed Files (TAR)',
    'GZ': 'Compressed Files (GZIP/GZ/TAR.GZ)',

    'VRM': 'Virtual Reality Model (VRM)',
    'OBJ': 'Object File (OBJ)',
    'STL': '3D Model (STL)',
    '3MF': '3D Model (3MF)',
    'FBX': '3D Model (FBX)',
    'GCODE': 'Sliced 3D Object (GCODE)',
    'UNITYPACKAGE': 'Unity Engine Package (UNITYPACKAGE)',
    'BLEND': 'Blender Project (BLEND)',
    'PMX': 'MikuMikuDance Model (PMX)',

    'MCWORLD': 'Minecraft Bedrock World (MCWORLD)',
    'GMA': 'Garry\'s Mod Addon (GMA)',
};

function getFileTypeDesc(filetype) {
    let ft = filetype.toUpperCase();
    if (knownFileTypes[ft] != null) {
        // warning the user if the filetype might be malicious
        if (
            ft == 'EXE' ||
            ft == 'MSI' ||
            ft == 'DMG' ||
            ft == 'ZIP' ||
            ft == 'RAR' ||
            ft == 'BAT' ||
            ft == 'CMD' ||
            ft == 'REG'
        ) warning = true;

        return 'File Type: ' + knownFileTypes[ft];
    } else return `File Type: ${filetype} File Format`;
}

function processPreview(filetype, link) {
    let previewArea = document.getElementById('previewArea');
    switch (filetype.toUpperCase()) {
    case 'MP4':
        previewArea.innerHTML = `<video controls src='${link}/stream'></video>`;
        break;
    case 'MOV': case 'MKV': case 'WEBM':
        previewArea.innerHTML = `<video controls src='${link}'></video>`;
        break;
    case 'PNG': case 'JPG': case 'JPEG': case 'WEBP': case 'BMP': case 'ICO': case 'GIF': case 'HEIC':
        previewArea.innerHTML = `<img src='${link}'>`;
        break;
    case 'MP3': case 'WAV': case 'FLAC': case 'AAC': case 'M4A':
        previewArea.innerHTML = `<audio controls src='${link}'></audio>`;
        break;
    case 'TTF': case 'OTF':
        previewArea.innerHTML = `
        <h3 class='font_preview'>The quick brown fox jumped over the lazy dog.</h3>
        <style>@font-face { font-family: previewFont; src: url('${link}'); } .font_preview { font-family: previewFont; }</style>`;
        break;
    default:
        previewArea.innerHTML = '<h5>Preview is not supported for this filetype.</h5>';
        break;
    }
}


// eslint-disable-next-line @typescript-eslint/no-unused-vars
function startDownload(username, filename) {
    if (!warning) {
        document.location = `/@${username}/${filename}?bypass=true&intent=download`;
        return;
    } else {
        if (confirm('WARNING: This file might be dangerous, are you sure you still want to download it?\n\nNever trust executable files from strangers online. Only trust executables from people you know and trust, like close friends and family.')) {
            document.location = `/@${username}/${filename}?intent=download`;
        }
    }
}