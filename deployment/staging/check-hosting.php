<?php

declare(strict_types=1);

$requiredExtensions = [
    'ctype', 'curl', 'dom', 'fileinfo', 'filter', 'gd', 'hash', 'iconv', 'json',
    'libxml', 'mbstring', 'openssl', 'pcre', 'pdo', 'pdo_mysql', 'phar', 'session',
    'simplexml', 'tokenizer', 'xml', 'xmlreader', 'xmlwriter', 'zip', 'zlib',
];

$failures = [];
$warnings = [];

if (PHP_VERSION_ID < 80200) {
    $failures[] = 'PHP 8.2.0 or newer is required.';
}

if (PHP_INT_SIZE < 8) {
    $failures[] = 'A 64-bit PHP build is required.';
}

foreach ($requiredExtensions as $extension) {
    if (! extension_loaded($extension)) {
        $failures[] = "Missing PHP extension: {$extension}";
    }
}

$pdoDrivers = class_exists(PDO::class) ? PDO::getAvailableDrivers() : [];
if (extension_loaded('pdo') && ! in_array('mysql', $pdoDrivers, true)) {
    $failures[] = 'The PDO MySQL driver is not available.';
}

function bytesFromIni(string $value): int
{
    $value = trim($value);
    if ($value === '' || $value === '-1') {
        return PHP_INT_MAX;
    }

    $number = (int) $value;

    return match (strtolower(substr($value, -1))) {
        'g' => $number * 1024 * 1024 * 1024,
        'm' => $number * 1024 * 1024,
        'k' => $number * 1024,
        default => $number,
    };
}

$memoryLimit = (string) ini_get('memory_limit');
if (bytesFromIni($memoryLimit) < 256 * 1024 * 1024) {
    $failures[] = "PHP memory_limit is {$memoryLimit}; the inventory import requires at least 256M (512M recommended).";
}

$projectRoot = dirname(__DIR__, 2);
foreach (['storage', 'bootstrap/cache'] as $relativePath) {
    $path = $projectRoot.DIRECTORY_SEPARATOR.$relativePath;
    if (is_dir($path) && ! is_writable($path)) {
        $failures[] = "Directory is not writable by PHP: {$path}";
    }
}

if (PHP_SAPI !== 'cli') {
    $warnings[] = 'Run this check through the same CLI PHP binary that will run Artisan and Composer.';
}

echo "SHIFTRIX Namecheap hosting preflight\n";
echo 'PHP: '.PHP_VERSION.' ('.PHP_SAPI.")\n";
echo '64-bit: '.(PHP_INT_SIZE >= 8 ? 'yes' : 'no')."\n";
echo "memory_limit: {$memoryLimit}\n";
echo 'PDO drivers: '.implode(', ', $pdoDrivers)."\n";

foreach ($warnings as $warning) {
    echo "WARN: {$warning}\n";
}

if ($failures !== []) {
    foreach ($failures as $failure) {
        echo "FAIL: {$failure}\n";
    }
    exit(1);
}

echo "PASS: PHP runtime satisfies the SHIFTRIX staging requirements.\n";
