<?php

namespace App\Services;

use App\Models\Batch;
use App\Models\InventoryImport;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Reader\Xlsx;
use RuntimeException;

class InventoryImportService
{
    private const SHEET = '1_LES_31500_LIENS_COMPLETS';

    private const HEADERS = [
        'N°_Ligne', 'Lot_Vague', 'Compteur_Lot_400_Pieces', 'Compteur_Global_30000_Pieces',
        'Variante', 'Code_ID_Imprime', 'Lien_NFC_et_QR_Complet', 'Type_Unite',
    ];

    public function process(string $path, bool $dryRun = false, ?int $userId = null): array
    {
        if (! is_file($path) || ! is_readable($path)) {
            throw new RuntimeException("Inventory workbook is not readable: {$path}");
        }

        $hash = hash_file('sha256', $path);
        if (! $dryRun && InventoryImport::where('file_sha256', $hash)->exists()) {
            throw new RuntimeException('This exact inventory workbook has already been imported.');
        }

        $reader = new Xlsx;
        $reader->setReadDataOnly(true);
        $reader->setLoadSheetsOnly([self::SHEET]);
        $spreadsheet = $reader->load($path);
        $sheet = $spreadsheet->getSheetByName(self::SHEET);

        if (! $sheet) {
            throw new RuntimeException('Required master worksheet is missing.');
        }

        $headers = array_values($sheet->rangeToArray('A1:H1', null, true, false)[0]);
        if ($headers !== self::HEADERS) {
            throw new RuntimeException('The master worksheet columns do not match the approved schema.');
        }

        $products = [];
        $ids = [];
        $urls = [];
        $lotCounts = array_fill(1, 75, 0);
        $distribution = [];
        $commercial = 0;
        $backup = 0;
        $errors = [];
        $variantLabels = ['Carte (CARD)' => 'CARD', 'Plaque (PLATE)' => 'PLATE', 'Chevalet (STAND)' => 'STAND'];

        $lastRow = $sheet->getHighestDataRow();
        $dataRows = $sheet->rangeToArray("A2:H{$lastRow}", null, true, false);
        foreach ($dataRows as $offset => $values) {
            $row = $offset + 2;
            $values = array_values($values);
            [$line, $lotLabel, $lotCounter, $globalCounter, $variantLabel, $code, $url, $unitLabel] = $values;
            $position = $row - 1;
            $lot = intdiv($position - 1, 420) + 1;
            $positionInBatch = (($position - 1) % 420) + 1;
            $variant = $variantLabels[$variantLabel] ?? null;
            $unitType = $unitLabel === 'STOCK VENTE (400 pcs / lot)' ? 'commercial'
                : ($unitLabel === 'RÉSERVE TEST USINE (+20 pcs / lot)' ? 'backup' : null);

            if ((int) $line !== $position) {
                $errors[] = "Row {$row}: invalid line sequence.";
            }
            if ($lot < 1 || $lot > 75 || ! str_starts_with((string) $lotLabel, sprintf('LOT %02d ', $lot))) {
                $errors[] = "Row {$row}: invalid batch assignment.";
            }
            $match = [];
            if (! $variant || ! preg_match('/^(CARD|PLATE|STAND)-(\d{5})$/', (string) $code, $match) || $match[1] !== $variant) {
                $errors[] = "Row {$row}: malformed product identifier.";
            }
            if ((string) $url !== Product::canonicalNfcUrl((string) $code)) {
                $errors[] = "Row {$row}: invalid activation URL.";
            }
            if (! $unitType || ($positionInBatch <= 400) !== ($unitType === 'commercial')) {
                $errors[] = "Row {$row}: invalid unit type allocation.";
            }
            if (isset($ids[$code])) {
                $errors[] = "Row {$row}: duplicate product identifier {$code}.";
            }
            if (isset($urls[$url])) {
                $errors[] = "Row {$row}: duplicate activation URL.";
            }

            $codeSequence = isset($match[2]) ? (int) $match[2] : 0;
            $expectedStart = (($lot - 1) * 140) + 1;
            if ($codeSequence < $expectedStart || $codeSequence > $expectedStart + 139) {
                $errors[] = "Row {$row}: identifier assigned to the wrong batch.";
            }

            $ids[$code] = true;
            $urls[$url] = true;
            $lotCounts[$lot]++;
            $distribution[$lot][$variant][$unitType] = ($distribution[$lot][$variant][$unitType] ?? 0) + 1;
            $unitType === 'commercial' ? $commercial++ : $backup++;

            $products[] = [
                'lot' => $lot,
                'code_id' => $code,
                'nfc_url' => (string) $url,
                'variant' => $variant,
                'code_sequence' => $codeSequence,
                'unit_type' => $unitType,
                'position_in_batch' => $positionInBatch,
                'source_line' => $position,
                'status' => 'unclaimed',
            ];
        }

        if (count($products) !== 31500 || count($ids) !== 31500 || count($urls) !== 31500) {
            $errors[] = 'The master worksheet must contain 31,500 unique products and URLs.';
        }
        if ($commercial !== 30000 || $backup !== 1500) {
            $errors[] = 'Commercial/backup totals do not reconcile.';
        }

        $expected = ['CARD' => ['commercial' => 134, 'backup' => 6], 'PLATE' => ['commercial' => 133, 'backup' => 7], 'STAND' => ['commercial' => 133, 'backup' => 7]];
        foreach (range(1, 75) as $lot) {
            if ($lotCounts[$lot] !== 420) {
                $errors[] = "LOT {$lot} does not contain 420 identifiers.";
            }
            foreach ($expected as $variant => $types) {
                foreach ($types as $type => $count) {
                    if (($distribution[$lot][$variant][$type] ?? 0) !== $count) {
                        $errors[] = "LOT {$lot} has an invalid {$variant} {$type} allocation.";
                    }
                }
            }
        }

        $report = [
            'rows' => count($products), 'unique_ids' => count($ids), 'unique_urls' => count($urls),
            'batches' => 75, 'commercial' => $commercial, 'backup' => $backup, 'errors' => array_slice($errors, 0, 100),
        ];

        $spreadsheet->disconnectWorksheets();
        unset($spreadsheet, $dataRows);

        if ($errors) {
            throw new RuntimeException('Inventory validation failed: '.implode(' ', array_slice($errors, 0, 5)));
        }

        if ($dryRun) {
            return $report;
        }

        DB::transaction(function () use ($path, $hash, $userId, $report, $products): void {
            $import = InventoryImport::create([
                'original_filename' => basename($path), 'file_sha256' => $hash,
                'total_rows' => 31500, 'commercial_rows' => 30000, 'backup_rows' => 1500,
                'status' => 'imported', 'validation_report' => $report, 'imported_by' => $userId,
                'validated_at' => now(), 'imported_at' => now(),
            ]);

            $batchIds = [];
            foreach (range(1, 75) as $lot) {
                $batchIds[$lot] = Batch::create([
                    'lot_number' => $lot, 'code' => sprintf('LOT-%02d', $lot),
                    'commercial_count' => 400, 'backup_count' => 20, 'total_count' => 420,
                    'inventory_import_id' => $import->id,
                ])->id;
            }

            $now = now();
            foreach (array_chunk($products, 500) as $chunk) {
                Product::insert(array_map(fn (array $product) => [
                    ...array_diff_key($product, ['lot' => true]),
                    'batch_id' => $batchIds[$product['lot']], 'inventory_import_id' => $import->id,
                    'created_at' => $now, 'updated_at' => $now,
                ], $chunk));
            }
        }, 3);

        return $report;
    }
}
