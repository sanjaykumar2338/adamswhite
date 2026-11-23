<?php

namespace App\Http\Requests;

use App\Models\Product;
use App\Services\ReviewUrlValidator;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        $product = $this->route('product');

        return $product instanceof Product && $this->user()?->can('update', $product) === true;
    }

    public function rules(): array
    {
        return [
            'display_name' => ['nullable', 'string', 'max:120'],
            'location_id' => [
                'nullable',
                'integer',
                Rule::exists('locations', 'id')->where('customer_id', $this->user()?->currentCustomer()?->id),
            ],
            'google_review_url' => [
                'required', 'string', 'max:2048',
                function (string $attribute, mixed $value, Closure $fail): void {
                    if (! app(ReviewUrlValidator::class)->isValid($value)) {
                        $fail(__('ui.validation.google_review_url'));
                    }
                },
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('display_name')) {
            $this->merge(['display_name' => blank($this->input('display_name')) ? null : trim((string) $this->input('display_name'))]);
        }
    }
}
