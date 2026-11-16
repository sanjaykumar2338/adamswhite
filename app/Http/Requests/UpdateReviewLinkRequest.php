<?php

namespace App\Http\Requests;

use App\Services\ReviewUrlValidator;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateReviewLinkRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'google_review_url' => [
                'required', 'string', 'max:2048',
                function (string $attribute, mixed $value, Closure $fail): void {
                    if (! app(ReviewUrlValidator::class)->isValid($value)) {
                        $fail('Enter a valid HTTPS Google Reviews URL.');
                    }
                },
            ],
        ];
    }
}
