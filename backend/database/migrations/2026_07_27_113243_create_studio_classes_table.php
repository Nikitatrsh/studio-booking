<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('studio_classes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('instructor_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedInteger('capacity');
            $table->string('day_of_week');
            $table->time('start_time');
            $table->unsignedInteger('duration');
            $table->boolean('is_recurring')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('studio_classes');
    }
};
