<?php
$iniPath = 'C:/laragon/bin/php/php-8.3.30-Win32-vs16-x64/php.ini';
$ini = file_get_contents($iniPath);
if (strpos($ini, ';extension=zip') !== false) {
    $ini = str_replace(';extension=zip', 'extension=zip', $ini);
    file_put_contents($iniPath, $ini);
    echo "extension=zip has been ENABLED in php.ini\n";
} elseif (strpos($ini, 'extension=zip') !== false) {
    echo "extension=zip is ALREADY enabled\n";
} else {
    echo "extension=zip line NOT FOUND\n";
}
// Verify
echo shell_exec('C:/laragon/bin/php/php-8.3.30-Win32-vs16-x64/php.exe -m') . "\n";
