<?php

namespace Tests\Unit;

use App\Services\ReviewUrlValidator;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class ReviewUrlValidatorTest extends TestCase
{
    #[DataProvider('validUrls')]
    public function test_it_accepts_supported_google_maps_and_review_urls(string $url): void
    {
        $this->assertTrue((new ReviewUrlValidator)->isValid($url));
    }

    #[DataProvider('invalidUrls')]
    public function test_it_rejects_unsupported_or_unsafe_urls(string $url): void
    {
        $this->assertFalse((new ReviewUrlValidator)->isValid($url));
    }

    public static function validUrls(): array
    {
        return [
            ['https://g.page/r/AbCdEf123/review'],
            ['https://g.page/example-business/review?rc'],
            ['https://maps.app.goo.gl/AbCdEf123'],
            ['https://goo.gl/maps/AbCdEf123'],
            ['https://www.google.com/maps/place/Example/@48.1,2.3,17z'],
            ['https://maps.google.fr/maps?cid=123456789'],
            ['https://search.google.com/local/writereview?placeid=ChIJ123'],
            ['https://www.google.co.uk/local/writereview?placeid=ChIJ123'],
        ];
    }

    public static function invalidUrls(): array
    {
        return [
            ['https://app.shiftrix.io/?id=CARD-00001'],
            ['https://shiftrix.io/products/CARD-00001'],
            ['https://google.com.evil.example/maps'],
            ['https://accounts.google.com/login'],
            ['https://www.google.com/'],
            ['https://maps.app.goo.gl/'],
            ['http://g.page/r/example/review'],
            ['https://user@g.page/r/example/review'],
            ['https://g.page:444/r/example/review'],
            ['javascript:alert(1)'],
        ];
    }
}
