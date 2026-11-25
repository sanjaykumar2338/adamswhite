<?php

namespace Tests\Unit;

use App\Support\TutorialMedia;
use Tests\TestCase;

class TutorialMediaTest extends TestCase
{
    public function test_it_uses_the_existing_tutorial_until_localized_files_are_available(): void
    {
        $originalPublicPath = public_path();
        $temporaryPublicPath = sys_get_temp_dir().'/shiftrix-tutorial-empty-'.bin2hex(random_bytes(8));
        mkdir($temporaryPublicPath);
        $this->app->usePublicPath($temporaryPublicPath);
        config(['services.shiftrix.tutorial_video_url' => 'https://media.example.com/existing-tutorial.mp4']);

        try {
            $media = (new TutorialMedia)->forLocale('fr');

            $this->assertSame('https://media.example.com/existing-tutorial.mp4', $media['videoUrl']);
            $this->assertSame('file', $media['videoType']);
            $this->assertNull($media['posterUrl']);
        } finally {
            $this->app->usePublicPath($originalPublicPath);
            rmdir($temporaryPublicPath);
        }
    }

    public function test_it_selects_only_the_requested_localized_video_and_its_poster(): void
    {
        $originalPublicPath = public_path();
        $temporaryPublicPath = sys_get_temp_dir().'/shiftrix-tutorial-'.bin2hex(random_bytes(8));
        mkdir($temporaryPublicPath.'/videos', 0777, true);
        file_put_contents($temporaryPublicPath.'/videos/tutorial-en.mp4', 'english');
        file_put_contents($temporaryPublicPath.'/videos/tutorial-en-poster.jpg', 'english poster');
        file_put_contents($temporaryPublicPath.'/videos/tutorial-fr.mp4', 'french');
        file_put_contents($temporaryPublicPath.'/videos/tutorial-fr-poster.jpg', 'french poster');
        $this->app->usePublicPath($temporaryPublicPath);

        try {
            $english = (new TutorialMedia)->forLocale('en');
            $french = (new TutorialMedia)->forLocale('fr');

            $this->assertStringEndsWith('/videos/tutorial-en.mp4', $english['videoUrl']);
            $this->assertStringEndsWith('/videos/tutorial-en-poster.jpg', $english['posterUrl']);
            $this->assertStringEndsWith('/videos/tutorial-fr.mp4', $french['videoUrl']);
            $this->assertStringEndsWith('/videos/tutorial-fr-poster.jpg', $french['posterUrl']);
            $this->assertSame('file', $english['videoType']);
            $this->assertSame('file', $french['videoType']);
        } finally {
            $this->app->usePublicPath($originalPublicPath);
            unlink($temporaryPublicPath.'/videos/tutorial-en.mp4');
            unlink($temporaryPublicPath.'/videos/tutorial-en-poster.jpg');
            unlink($temporaryPublicPath.'/videos/tutorial-fr.mp4');
            unlink($temporaryPublicPath.'/videos/tutorial-fr-poster.jpg');
            rmdir($temporaryPublicPath.'/videos');
            rmdir($temporaryPublicPath);
        }
    }
}
