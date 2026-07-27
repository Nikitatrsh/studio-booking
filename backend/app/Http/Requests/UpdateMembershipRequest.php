<?php

namespace App\Http\Requests;

use App\Enums\MembershipStatus;
use App\Enums\MembershipTier;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateMembershipRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'tier' => ['sometimes', new Enum(MembershipTier::class)],
            'status' => ['sometimes', new Enum(MembershipStatus::class)],
            'start_date' => ['sometimes', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'credits_remaining' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
