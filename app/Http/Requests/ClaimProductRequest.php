<?php

namespace App\Http\Requests;

use App\Services\ReviewUrlValidator;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ClaimProductRequest extends FormRequest
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
            'code_id' => ['required', 'string', 'regex:/^(CARD|PLATE|STAND)-\d{5}$/'],
            'business_name' => ['required', 'string', 'max:255'],
            'google_review_url' => [
                'required', 'string', 'max:2048',
                function (string $attribute, mixed $value, Closure $fail): void {
                    if (! app(ReviewUrlValidator::class)->isValid($value)) {
                        $fail(__(app(ReviewUrlValidator::class)->isShiftrixProductUrl($value)
                            ? 'ui.validation.shiftrix_product_url'
                            : 'ui.validation.google_review_url'));
                    }
                },
            ],
        ];
    }
}
