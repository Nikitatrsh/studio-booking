<?php

namespace App\Http\Requests;

use App\Enums\DayOfWeek;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreStudioClassRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            // admins may assign a class to any instructor; instructors default to themselves
            'instructor_id' => ['sometimes', 'exists:users,id'],
            'capacity' => ['required', 'integer', 'min:1'],
            'day_of_week' => ['required', new Enum(DayOfWeek::class)],
            'start_time' => ['required', 'date_format:H:i'],
            'duration' => ['required', 'integer', 'min:1'],
            'is_recurring' => ['sometimes', 'boolean'],
        ];
    }
}
