<?php

namespace Tests\Feature;

use Tests\TestCase;

class BrandingTest extends TestCase
{
    public function test_application_shell_uses_shiftrix_branding_and_browser_icons(): void
    {
        $this->get('/login')
            ->assertOk()
            ->assertSee('<title inertia>SHIFTRIX</title>', false)
            ->assertSee('name="application-name" content="SHIFTRIX"', false)
            ->assertSee('rel="icon" href="/favicon.svg"', false)
            ->assertSee('rel="icon" href="/favicon.ico"', false)
            ->assertSee('rel="apple-touch-icon" href="/apple-touch-icon.png"', false)
            ->assertSee('rel="manifest" href="/site.webmanifest"', false)
            ->assertDontSee('>Laravel</title>', false);
    }

    public function test_brand_assets_are_available_publicly(): void
    {
        foreach (['favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'site.webmanifest'] as $asset) {
            $this->assertFileExists(public_path($asset));
            $this->assertGreaterThan(0, filesize(public_path($asset)));
        }
    }
}
