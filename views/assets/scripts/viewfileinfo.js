function doInfo(_filesize, _filetype) {
    document.getElementById('size').innerHTML = "Size: " + (_filesize / 1024 / 1024).toFixed(2) + "MB";
    
    
    document.getElementById('type').innerHTML = getFileTypeDesc(_filetype);
}

let knownFileTypes = {
    "PNG":"Image / Portable Network Graphic (PNG)",
    "JPG":"Image (JPG)",
    "JPEG":"Image (JPEG)",
    "WEBP":"Image (WEBP)",
    "PSD":"Photoshop Document (PSD)",
    "HEIC":"Image / High Efficiency Image Container (HEIC)",
    "BMP":"Image / Bitmap Graphic (BMP)",
    "ICO":"Image / Icon (ICO)",

    "MP4":"Video (MP4)",
    "MOV":"Video (MOV)",
    "GIF":"Image (GIF)",
    "MKV":"Video / Mastroska (MKV)",
    "WEBM":"Video (WEBM)",


    "MP3":"Audio (MP3)",
    "FLAC":"Lossless Audio (FLAC)",
    "WAV":"Audio / Microsoft Wave File (WAV)",


    "EXE":"Windows Executable (EXE)",
    "BAT":"Windows Batch File (BAT)",
    "CMD":"Windows Batch File (CMD)",
    "ISO": "Disk Image (ISO)",
    "DLL":"Dynamic Link Library (DLL)",
    "CUR":"Cursor File (CUR)",
    "INF":"Setup Information (INF)",

    "PDF":"Document (PDF)",
    "TXT":"Text File (TXT)",
    "PPTX":"Microsoft PowerPoint Document (PPTX)",
    "DOCX":"Microsoft Word Document (DOCX)",
    "XML":"XML Document (XML)",

    "HTML":"Webpage (HTML)",
    "JS":"JavaScript File (JS)",
    "EJS":"Embedded JavaScript Webpage (EJS)",
    "JSON":"JavaScript Object Notation (JSON)",
    "GITIGNORE":"Git Ignore File",
    "MD":"Markdown File (MD)",
    "CSS":"Cascading Stylesheet (CSS)",
    "YAML":"YAML File (YAML)",
    "YML":"YAML File (YML)",

    "TTF":"TrueType Font (TTF)",
    "OTF":"Font (OTF)",

    "VP1":"VanillaPack Gen 1 Package (VP1)",
    "ZIP":"Compressed Files (ZIP)",
    "RAR":"Compressed Files (RAR)",
    "TAR":"Compressed Files (TAR)",
    "GZ":"Compressed Files (GZ/TAR.GZ)",

    "VRM":"Virtual Reality Model (VRM)",
    "OBJ":"Object File (OBJ)",
    "STL":"3D Model (STL)",
    "3MF":"3D Model (3MF)"
}

function getFileTypeDesc(_ft) {
    if (knownFileTypes[_ft.toUpperCase()] != null) {
        return "File Type: " + knownFileTypes[_ft.toUpperCase()];
    } else return `File Type: ${_ft} File Format`;
}