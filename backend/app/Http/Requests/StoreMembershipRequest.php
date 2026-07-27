<?php

namespace App\Http\Requests;

use App\Enums\MembershipStatus;
use App\Enums\MembershipTier;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class StoreMembershipRequest extends FormRequest
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
            'user_id' => ['required', 'exists:users,id'],
            'tier' => ['required', new Enum(MembershipTier::class)],
            'status' => ['sometimes', new Enum(MembershipStatus::class)],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'credits_remaining' => [
                Rule::requiredIf($this->input('tier') === MembershipTier::PayPerClass->value),
                'nullable',
                'integer',
                'min:0',
            ],
        ];
    }
}
