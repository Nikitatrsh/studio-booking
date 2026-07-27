<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\MembershipController;
use App\Http\Controllers\Api\StudioClassController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::apiResource('studio-classes', StudioClassController::class);
    Route::apiResource('memberships', MembershipController::class);
    Route::apiResource('bookings', BookingController::class)->only(['index', 'store', 'show', 'destroy']);
});
