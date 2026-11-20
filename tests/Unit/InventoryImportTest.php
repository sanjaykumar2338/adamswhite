<?php

namespace Tests\Unit;

use App\Services\InventoryImportService;
use RuntimeException;
use Tests\TestCase;

class InventoryImportTest extends TestCase
{
    public function test_inventory_workbook_must_be_readable(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Inventory workbook is not readable');

        app(InventoryImportService::class)->process('/definitely/missing/shiftrix-inventory.xlsx', true);
    }
}
