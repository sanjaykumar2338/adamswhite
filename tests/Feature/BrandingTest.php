<?php

namespace Tests\Feature;

use Tests\TestCase;

class BrandingTest extends TestCase
{
    public function test_application_shell_uses_shiftrix_track_branding_and_browser_icons(): void
    {
        $this->get('/login')
            ->assertOk()
            ->assertSee('<title inertia>Shiftrix Track</title>', false)
            ->assertSee('name="application-name" content="Shiftrix Track"', false)
            ->assertSee('name="apple-mobile-web-app-title" content="Shiftrix Track"', false)
            ->assertSee('property="og:site_name" content="Shiftrix Track"', false)
            ->assertSee('name="description"', false)
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

        $this->assertStringContainsString('aria-label="Shiftrix Track"', file_get_contents(public_path('favicon.svg')));
        $this->assertStringContainsString('"name": "Shiftrix Track"', file_get_contents(public_path('site.webmanifest')));
    }

    public function test_client_photography_is_optimized_and_bilingual_marketing_copy_is_present(): void
    {
        foreach (['customer-login.webp', 'customer-activation.webp', 'admin-portal.webp'] as $asset) {
            $path = public_path('images/marketing/'.$asset);
            $this->assertFileExists($path);
            $this->assertLessThan(200 * 1024, filesize($path), $asset.' must remain below 200 KB.');
        }

        $translations = file_get_contents(resource_path('js/i18n.js'));
        $this->assertStringContainsString('Turn every customer interaction into useful, authentic feedback.', $translations);
        $this->assertStringContainsString('Transformez chaque interaction client en retour utile et authentique.', $translations);
        $this->assertStringNotContainsString('5-Star Reviews', $translations);
        $this->assertStringNotContainsString('Défis et récompenses', $translations);
        $this->assertStringContainsString('Activate Your SHIFTRIX Asset in 30 Seconds.', $translations);
        $this->assertStringContainsString('Activez votre produit SHIFTRIX en 30 secondes.', $translations);
    }

    public function test_visible_application_branding_does_not_reference_shiftrix_pro(): void
    {
        foreach ([resource_path('js'), resource_path('views'), lang_path(), public_path('images')] as $directory) {
            $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($directory));

            foreach ($iterator as $file) {
                if (! $file->isFile() || ! in_array(strtolower($file->getExtension()), ['js', 'jsx', 'php', 'svg', 'json'], true)) {
                    continue;
                }

                $this->assertDoesNotMatchRegularExpression('/shiftrix[\s_-]*pro\b/i', file_get_contents($file->getPathname()), $file->getPathname());
            }
        }
    }
}
