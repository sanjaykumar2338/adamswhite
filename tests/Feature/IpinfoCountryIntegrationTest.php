<?php

namespace Tests\Feature;

use App\Jobs\ResolveScanCountry;
use App\Models\Batch;
use App\Models\Customer;
use App\Models\InventoryImport;
use App\Models\Product;
use App\Models\ScanEvent;
use App\Models\User;
use App\Services\IpinfoCountryResolver;
use App\Services\ScanRecorder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class IpinfoCountryIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.ipinfo_lite.enabled' => true,
            'services.ipinfo_lite.token' => 'test-token-not-a-real-credential',
            'services.ipinfo_lite.endpoint' => 'https://api.ipinfo.io/lite',
            'services.ipinfo_lite.cache_ttl' => 3600,
        ]);
    }

    public function test_successful_india_lookup_uses_country_code_and_caches_it(): void
    {
        Http::fake(['api.ipinfo.io/*' => Http::response([
            'ip' => '49.36.0.1',
            'country_code' => 'in',
            'country' => 'India',
        ])]);

        $resolver = app(IpinfoCountryResolver::class);
        $this->assertSame('IN', $resolver->resolve('49.36.0.1'));

        Http::fake(fn () => throw new ConnectionException('A cache hit must not call IPinfo.'));
        $this->assertSame('IN', $resolver->resolve('49.36.0.1'));
        Http::assertNothingSent();
    }

    public function test_api_auth_rate_limit_timeout_and_invalid_responses_fail_closed(): void
    {
        $resolver = app(IpinfoCountryResolver::class);

        foreach ([401, 429] as $status) {
            Cache::flush();
            Http::fake(['api.ipinfo.io/*' => Http::response(['error' => 'upstream failure'], $status)]);
            $this->assertNull($resolver->resolve('8.8.8.8'));
        }

        Cache::flush();
        Http::fake(fn () => throw new ConnectionException('Connection timed out.'));
        $this->assertNull($resolver->resolve('8.8.8.8'));

        Cache::flush();
        Http::fakeSequence()
            ->push('not-json', 200, ['Content-Type' => 'application/json'])
            ->push(['ip' => '1.1.1.1'], 200)
            ->push(['ip' => '9.9.9.9', 'country_code' => 'ZZ'], 200);
        $this->assertNull($resolver->resolve('8.8.8.8'));
        $this->assertNull($resolver->resolve('1.1.1.1'));
        $this->assertNull($resolver->resolve('9.9.9.9'));
    }

    public function test_disabled_api_and_non_public_addresses_never_make_requests(): void
    {
        Http::preventStrayRequests();
        $resolver = app(IpinfoCountryResolver::class);

        $this->assertTrue(IpinfoCountryResolver::isPublicIp('8.8.8.8'));
        $this->assertTrue(IpinfoCountryResolver::isPublicIp('2001:4860:4860::8888'));

        foreach (['not-an-ip', '999.999.999.999', '127.0.0.1', '10.0.0.1', '192.168.1.1', '::1', '2001:db8::1'] as $ip) {
            $this->assertNull($resolver->resolve($ip));
        }

        config(['services.ipinfo_lite.enabled' => false]);
        $this->assertNull($resolver->resolve('8.8.8.8'));
        Http::assertNothingSent();
    }

    public function test_only_signed_edge_metadata_is_trusted_and_public_fallback_is_deferred(): void
    {
        config(['services.shiftrix.edge_secret' => 'edge-test-secret']);
        [, , $product] = $this->workspace(1);

        $trusted = Request::create('/configuration?id='.$product->code_id, 'GET', [], [], [], [
            'HTTP_X_SHIFTRIX_EDGE' => 'edge-test-secret',
            'HTTP_X_SHIFTRIX_COUNTRY' => 'in',
            'HTTP_CF_IPCOUNTRY' => 'US',
            'REMOTE_ADDR' => '127.0.0.1',
        ]);
        $event = app(ScanRecorder::class)->record($product, $trusted, 'redirected');
        $this->assertSame('IN', $event->country_code);

        [, , $otherProduct] = $this->workspace(2);
        $spoofed = Request::create('/configuration?id='.$otherProduct->code_id, 'GET', [], [], [], [
            'HTTP_X_SHIFTRIX_EDGE' => 'wrong-secret',
            'HTTP_X_SHIFTRIX_COUNTRY' => 'FR',
            'HTTP_CF_IPCOUNTRY' => 'FR',
            'HTTP_X_FORWARDED_FOR' => '49.36.0.1',
            'REMOTE_ADDR' => '127.0.0.1',
        ]);
        $this->assertNull(app(ScanRecorder::class)->record($otherProduct, $spoofed, 'redirected')->country_code);

        Bus::fake();
        [, , $fallbackProduct] = $this->workspace(3);
        $trustedWithoutCountry = Request::create('/configuration?id='.$fallbackProduct->code_id, 'GET', [], [], [], [
            'HTTP_X_SHIFTRIX_EDGE' => 'edge-test-secret',
            'HTTP_X_FORWARDED_FOR' => '49.36.0.1',
            'REMOTE_ADDR' => '127.0.0.1',
        ]);
        app(ScanRecorder::class)->record($fallbackProduct, $trustedWithoutCountry, 'redirected');
        Bus::assertDispatched(ResolveScanCountry::class, fn (ResolveScanCountry $job) => $job->ip === '49.36.0.1');

        [, , $botProduct] = $this->workspace(4);
        $bot = Request::create('/configuration?id='.$botProduct->code_id, 'GET', [], [], [], [
            'HTTP_X_SHIFTRIX_EDGE' => 'edge-test-secret',
            'HTTP_X_FORWARDED_FOR' => '8.8.8.8',
            'HTTP_USER_AGENT' => 'Googlebot/2.1',
            'REMOTE_ADDR' => '127.0.0.1',
        ]);
        app(ScanRecorder::class)->record($botProduct, $bot, 'redirected');
        Bus::assertDispatchedTimes(ResolveScanCountry::class, 1);
    }

    public function test_country_job_updates_only_an_eligible_unknown_scan(): void
    {
        [, $customer, $product] = $this->workspace(4);
        $event = $this->scan($product, $customer, null);
        Http::fake(['api.ipinfo.io/*' => Http::response(['ip' => '49.36.0.1', 'country_code' => 'IN'])]);

        app()->call([new ResolveScanCountry($event->id, '49.36.0.1'), 'handle']);

        $this->assertSame('IN', $event->fresh()->country_code);

        $known = $this->scan($product, $customer, 'FR');
        app()->call([new ResolveScanCountry($known->id, '49.36.0.1'), 'handle']);
        $this->assertSame('FR', $known->fresh()->country_code);
    }

    public function test_redirect_and_scan_recording_survive_geolocation_failure(): void
    {
        [, , $product] = $this->workspace(5);
        Http::fake(fn () => throw new ConnectionException('IPinfo unavailable.'));

        $this->withServerVariables(['REMOTE_ADDR' => '8.8.8.8'])
            ->get('/?id='.$product->code_id)
            ->assertRedirect($product->google_review_url);

        $this->assertDatabaseHas('scan_events', [
            'product_id' => $product->id,
            'result' => 'redirected',
            'country_code' => null,
        ]);
    }

    public function test_india_iphone_redirect_is_enriched_after_the_response(): void
    {
        [, , $product] = $this->workspace(8);
        Http::fake(['api.ipinfo.io/*' => Http::response([
            'ip' => '49.36.0.1',
            'country_code' => 'IN',
            'country' => 'India',
        ])]);

        $this->withServerVariables([
            'REMOTE_ADDR' => '49.36.0.1',
            'HTTP_USER_AGENT' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
        ])->get('/?id='.$product->code_id)
            ->assertRedirect($product->google_review_url);

        $this->assertDatabaseHas('scan_events', [
            'product_id' => $product->id,
            'result' => 'redirected',
            'device_category' => 'iphone',
            'country_code' => 'IN',
        ]);
    }

    public function test_customer_and_admin_statistics_use_verified_countries_with_customer_isolation(): void
    {
        [$owner, $customer, $product] = $this->workspace(6);
        [, $otherCustomer, $otherProduct] = $this->workspace(7);
        $this->scan($product, $customer, 'IN');
        $this->scan($product, $customer, null);
        $this->scan($otherProduct, $otherCustomer, 'FR');

        $this->actingAs($owner)->get(route('statistics.index', ['days' => 7]))
            ->assertInertia(fn ($page) => $page
                ->where('total', 2)
                ->where('countries.0', ['country' => 'IN', 'total' => 1])
                ->where('countries.1', ['country' => 'unknown', 'total' => 1])
            );

        $admin = User::factory()->create(['is_admin' => true]);
        $this->actingAs($admin)->get(route('admin.statistics.index', ['days' => 7]))
            ->assertInertia(fn ($page) => $page
                ->where('total', 3)
                ->where('countries.0.total', 1)
                ->where('countries.1.total', 1)
                ->where('countries.2.total', 1)
            );
    }

    private function workspace(int $suffix): array
    {
        $owner = User::factory()->create();
        $customer = Customer::create(['business_name' => 'IPinfo Test '.$suffix, 'max_products' => 10]);
        $customer->users()->attach($owner->id, ['role' => 'owner', 'status' => 'active']);
        $import = InventoryImport::create(['original_filename' => "ipinfo-{$suffix}.xlsx", 'file_sha256' => hash('sha256', "ipinfo-{$suffix}"), 'total_rows' => 1, 'commercial_rows' => 1, 'backup_rows' => 0, 'status' => 'imported']);
        $batch = Batch::create(['lot_number' => $suffix, 'code' => 'LOT-IP-'.str_pad((string) $suffix, 2, '0', STR_PAD_LEFT), 'commercial_count' => 1, 'backup_count' => 0, 'total_count' => 1, 'inventory_import_id' => $import->id]);
        $product = Product::create(['batch_id' => $batch->id, 'inventory_import_id' => $import->id, 'customer_id' => $customer->id, 'code_id' => 'CARD-'.str_pad((string) (2000 + $suffix), 5, '0', STR_PAD_LEFT), 'variant' => 'CARD', 'code_sequence' => 2000 + $suffix, 'unit_type' => 'commercial', 'position_in_batch' => 1, 'source_line' => 2000 + $suffix, 'status' => 'active', 'google_review_url' => 'https://g.page/r/ipinfo/review']);

        return [$owner, $customer, $product];
    }

    private function scan(Product $product, Customer $customer, ?string $country): ScanEvent
    {
        return ScanEvent::create([
            'product_id' => $product->id,
            'customer_id' => $customer->id,
            'request_uuid' => (string) Str::uuid(),
            'result' => 'redirected',
            'country_code' => $country,
            'is_probable_bot' => false,
            'scanned_at' => now(),
        ]);
    }
}
