<?php

namespace App\Http\Requests;

use App\Enums\DayOfWeek;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateStudioClassRequest extends FormRequest
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
            'name' => ['sometimes', 'string', 'max:255'],
            'instructor_id' => ['sometimes', 'exists:users,id'],
            'capacity' => ['sometimes', 'integer', 'min:1'],
            'day_of_week' => ['sometimes', new Enum(DayOfWeek::class)],
            'start_time' => ['sometimes', 'date_format:H:i'],
            'duration' => ['sometimes', 'integer', 'min:1'],
            'is_recurring' => ['sometimes', 'boolean'],
        ];
    }
}
