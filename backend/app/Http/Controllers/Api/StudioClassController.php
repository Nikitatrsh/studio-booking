<?php

namespace App\Http\Controllers\Api;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStudioClassRequest;
use App\Http\Requests\UpdateStudioClassRequest;
use App\Models\StudioClass;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class StudioClassController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            StudioClass::with('instructor:id,name')->withCount($this->bookingCounts())->get()
        );
    }

    public function store(StoreStudioClassRequest $request): JsonResponse
    {
        $this->authorize('create', StudioClass::class);

        $data = $request->validated();

        // instructors can only ever create classes under their own name
        $data['instructor_id'] = $request->user()->isAdmin() && isset($data['instructor_id'])
            ? $data['instructor_id']
            : $request->user()->id;

        $studioClass = StudioClass::create($data);
        $studioClass->refresh();

        return response()->json($studioClass->load('instructor:id,name'), 201);
    }

    public function show(StudioClass $studioClass): JsonResponse
    {
        $this->authorize('view', $studioClass);

        $studioClass->loadCount($this->bookingCounts());

        return response()->json($studioClass->load('instructor:id,name'));
    }

    public function update(UpdateStudioClassRequest $request, StudioClass $studioClass): JsonResponse
    {
        $this->authorize('update', $studioClass);

        $studioClass->update($request->validated());

        return response()->json($studioClass->load('instructor:id,name'));
    }

    public function destroy(StudioClass $studioClass): JsonResponse
    {
        $this->authorize('delete', $studioClass);

        $studioClass->delete();

        return response()->json(null, 204);
    }

    /**
     * @return array<string, \Closure>
     */
    private function bookingCounts(): array
    {
        return [
            'bookings as booked_count' => fn (Builder $query) => $query->where('status', BookingStatus::Booked),
            'bookings as waitlisted_count' => fn (Builder $query) => $query->where('status', BookingStatus::Waitlisted),
        ];
    }
}
