<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

class NfcUrlMigrationService
{
    public function audit(?int $expectedCount = 31500): array
    {
        if (! Schema::hasColumn('products', 'nfc_url')) {
            throw new RuntimeException('The products.nfc_url column is missing. Run the additive schema migration first.');
        }

        $count = 0;
        $changes = 0;
        $ids = [];
        $urls = [];
        $errors = [];
        $fingerprint = hash_init('sha256');

        foreach (Product::query()->orderBy('id')->cursor() as $product) {
            $count++;
            $canonical = Product::canonicalNfcUrl($product->code_id);
            $rawUrl = $product->getRawOriginal('nfc_url');

            if (! preg_match('/^(CARD|PLATE|STAND)-\d{5}$/', $product->code_id)) {
                $errors[] = "Invalid product ID: {$product->code_id}";
            }
            if (isset($ids[$product->code_id])) {
                $errors[] = "Duplicate product ID: {$product->code_id}";
            }
            if (isset($urls[$canonical])) {
                $errors[] = "Duplicate canonical NFC URL: {$canonical}";
            }
            if ($rawUrl !== $canonical) {
                $changes++;
            }

            $ids[$product->code_id] = true;
            $urls[$canonical] = true;
            hash_update($fingerprint, implode('|', [
                $product->id,
                $product->code_id,
                $product->variant,
                $product->batch_id,
                $product->customer_id ?? '',
                $product->status,
            ])."\n");
        }

        if ($expectedCount !== null && $count !== $expectedCount) {
            $errors[] = "Expected {$expectedCount} products, found {$count}.";
        }

        return [
            'products' => $count,
            'unique_ids' => count($ids),
            'unique_canonical_urls' => count($urls),
            'urls_to_change' => $changes,
            'scan_events' => DB::table('scan_events')->count(),
            'activations' => DB::table('activations')->count(),
            'integrity_fingerprint' => hash_final($fingerprint),
            'errors' => array_slice($errors, 0, 100),
        ];
    }

    public function apply(string $backupDirectory, ?int $expectedCount = 31500): array
    {
        $before = $this->audit($expectedCount);
        $this->assertValid($before);
        $backup = $this->backup($backupDirectory);

        $after = DB::transaction(function () use ($before, $expectedCount): array {
            Product::query()->orderBy('id')->chunkById(500, function ($products): void {
                foreach ($products as $product) {
                    $canonical = Product::canonicalNfcUrl($product->code_id);
                    if ($product->getRawOriginal('nfc_url') !== $canonical) {
                        DB::table('products')->where('id', $product->id)->update(['nfc_url' => $canonical]);
                    }
                }
            });

            $after = $this->audit($expectedCount);
            $this->assertValid($after);
            if ($after['urls_to_change'] !== 0
                || $before['integrity_fingerprint'] !== $after['integrity_fingerprint']
                || $before['scan_events'] !== $after['scan_events']
                || $before['activations'] !== $after['activations']) {
                throw new RuntimeException('Post-migration integrity validation failed. URL writes were rolled back; retain the verified backups.');
            }

            return $after;
        }, 3);

        return ['backup' => $backup, 'before' => $before, 'after' => $after];
    }

    public function rollback(string $backupPath, ?int $expectedCount = 31500): array
    {
        $this->verifyChecksum($backupPath);
        $handle = fopen($backupPath, 'rb');
        if (! $handle) {
            throw new RuntimeException("Cannot read NFC URL backup: {$backupPath}");
        }

        $header = fgetcsv($handle);
        $expectedHeader = ['id', 'code_id', 'variant', 'batch_id', 'customer_id', 'status', 'nfc_url'];
        if ($header !== $expectedHeader) {
            fclose($handle);
            throw new RuntimeException('NFC URL backup has an unexpected header.');
        }

        $rows = [];
        while (($row = fgetcsv($handle)) !== false) {
            $rows[] = array_combine($expectedHeader, $row);
        }
        fclose($handle);

        if ($expectedCount !== null && count($rows) !== $expectedCount) {
            throw new RuntimeException("Expected {$expectedCount} backup rows, found ".count($rows).'.');
        }

        DB::transaction(function () use ($rows): void {
            foreach (array_chunk($rows, 500) as $chunk) {
                foreach ($chunk as $row) {
                    $product = Product::query()->findOrFail((int) $row['id']);
                    foreach (['code_id', 'variant', 'batch_id', 'status'] as $field) {
                        if ((string) $product->{$field} !== (string) $row[$field]) {
                            throw new RuntimeException("Backup integrity mismatch for product {$row['id']} ({$field}).");
                        }
                    }
                    if ((string) ($product->customer_id ?? '') !== (string) $row['customer_id']) {
                        throw new RuntimeException("Backup integrity mismatch for product {$row['id']} (customer_id).");
                    }
                    DB::table('products')->where('id', $product->id)->update([
                        'nfc_url' => $row['nfc_url'] === '' ? null : $row['nfc_url'],
                    ]);
                }
            }
        }, 3);

        return ['restored_rows' => count($rows), 'audit' => $this->audit($expectedCount)];
    }

    private function backup(string $directory): array
    {
        if (! is_dir($directory) && ! mkdir($directory, 0750, true) && ! is_dir($directory)) {
            throw new RuntimeException("Cannot create NFC URL backup directory: {$directory}");
        }

        $path = rtrim($directory, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.'nfc-urls-before-'.now()->format('Ymd-His-u').'.csv';
        $handle = fopen($path, 'xb');
        if (! $handle) {
            throw new RuntimeException("Cannot create NFC URL backup: {$path}");
        }

        fputcsv($handle, ['id', 'code_id', 'variant', 'batch_id', 'customer_id', 'status', 'nfc_url']);
        foreach (Product::query()->orderBy('id')->cursor() as $product) {
            fputcsv($handle, [
                $product->id,
                $product->code_id,
                $product->variant,
                $product->batch_id,
                $product->customer_id,
                $product->status,
                $product->getRawOriginal('nfc_url'),
            ]);
        }
        fclose($handle);

        $checksum = hash_file('sha256', $path);
        file_put_contents($path.'.sha256', $checksum.'  '.basename($path).PHP_EOL, LOCK_EX);

        return ['path' => $path, 'sha256' => $checksum, 'checksum_path' => $path.'.sha256'];
    }

    private function verifyChecksum(string $path): void
    {
        $checksumPath = $path.'.sha256';
        if (! is_file($path) || ! is_file($checksumPath)) {
            throw new RuntimeException('Both the backup CSV and its .sha256 file are required.');
        }
        $expected = strtok(trim((string) file_get_contents($checksumPath)), " \t");
        if (! is_string($expected) || ! hash_equals($expected, hash_file('sha256', $path))) {
            throw new RuntimeException('NFC URL backup checksum verification failed.');
        }
    }

    private function assertValid(array $audit): void
    {
        if ($audit['errors'] !== []) {
            throw new RuntimeException('NFC URL validation failed: '.implode(' ', array_slice($audit['errors'], 0, 5)));
        }
    }
}
