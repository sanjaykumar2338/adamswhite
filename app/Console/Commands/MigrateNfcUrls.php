<?php

namespace App\Console\Commands;

use App\Services\NfcUrlMigrationService;
use Illuminate\Console\Command;
use Throwable;

class MigrateNfcUrls extends Command
{
    protected $signature = 'shiftrix:nfc-urls
        {--apply : Back up and write canonical NFC URLs}
        {--rollback= : Restore NFC URLs from a verified backup CSV}
        {--backup-dir= : Directory for the pre-change CSV and checksum}
        {--expected-count=31500 : Required product count; use 0 only for a controlled non-production validation}';

    protected $description = 'Dry-run, apply, validate, or roll back the canonical SHIFTRIX NFC URL migration';

    public function handle(NfcUrlMigrationService $service): int
    {
        $expected = (int) $this->option('expected-count');
        $expected = $expected > 0 ? $expected : null;

        try {
            if ($rollback = $this->option('rollback')) {
                $result = $service->rollback($this->absolutePath((string) $rollback), $expected);
                $this->info("Restored {$result['restored_rows']} NFC URL rows from the verified backup.");
                $this->displayAudit($result['audit']);

                return self::SUCCESS;
            }

            if ($this->option('apply')) {
                $directory = $this->option('backup-dir')
                    ? $this->absolutePath((string) $this->option('backup-dir'))
                    : storage_path('app/private/nfc-url-migrations');
                $result = $service->apply($directory, $expected);
                $this->info('Canonical NFC URL migration completed and validated.');
                $this->line('Backup: '.$result['backup']['path']);
                $this->line('SHA-256: '.$result['backup']['sha256']);
                $this->displayAudit($result['after']);

                return self::SUCCESS;
            }

            $audit = $service->audit($expected);
            $this->displayAudit($audit);
            if ($audit['errors'] !== []) {
                foreach ($audit['errors'] as $error) {
                    $this->error($error);
                }

                return self::FAILURE;
            }
            $this->info('Dry-run passed. No database changes were made.');

            return self::SUCCESS;
        } catch (Throwable $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }
    }

    private function displayAudit(array $audit): void
    {
        $this->table(['Metric', 'Value'], collect($audit)->except(['errors', 'integrity_fingerprint'])->map(fn ($value, $key) => [$key, $value])->values()->all());
        $this->line('Integrity fingerprint: '.$audit['integrity_fingerprint']);
    }

    private function absolutePath(string $path): string
    {
        return str_starts_with($path, DIRECTORY_SEPARATOR) ? $path : base_path($path);
    }
}
