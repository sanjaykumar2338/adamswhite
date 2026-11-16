<?php

namespace App\Console\Commands;

use App\Services\InventoryImportService;
use Illuminate\Console\Command;
use Throwable;

class ImportInventory extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'shiftrix:inventory:import {path : Absolute or project-relative XLSX path} {--dry-run : Validate without writing to the database}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Validate and transactionally import the approved 31,500-product SHIFTRIX workbook';

    /**
     * Execute the console command.
     */
    public function handle(InventoryImportService $service): int
    {
        $path = (string) $this->argument('path');
        $path = str_starts_with($path, DIRECTORY_SEPARATOR) ? $path : base_path($path);

        try {
            $report = $service->process($path, (bool) $this->option('dry-run'));
        } catch (Throwable $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        $this->table(['Metric', 'Count'], collect($report)->except('errors')->map(fn ($value, $key) => [$key, $value])->values()->all());
        $this->info($this->option('dry-run') ? 'Validation passed. No database changes were made.' : 'Inventory imported successfully.');

        return self::SUCCESS;
    }
}
