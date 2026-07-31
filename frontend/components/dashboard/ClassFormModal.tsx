"use client";

import { FormEvent, useState } from "react";
import { api, ApiError, type DayOfWeek, type StudioClass, type StudioClassInstructor } from "@/lib/api";
import { dayLabel } from "@/lib/schedule";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

const DAY_OPTIONS: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

interface ClassFormModalProps {
  studioClass?: StudioClass;
  instructorOptions?: StudioClassInstructor[];
  onClose: () => void;
  onSaved: () => void;
}

export default function ClassFormModal({
  studioClass,
  instructorOptions,
  onClose,
  onSaved,
}: ClassFormModalProps) {
  const isEditing = Boolean(studioClass);
  const [name, setName] = useState(studioClass?.name ?? "");
  const [instructorId, setInstructorId] = useState(
    studioClass?.instructor_id?.toString() ?? instructorOptions?.[0]?.id.toString() ?? "",
  );
  const [capacity, setCapacity] = useState(studioClass?.capacity ?? 10);
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(studioClass?.day_of_week ?? "monday");
  const [startTime, setStartTime] = useState(studioClass?.start_time ?? "09:00");
  const [duration, setDuration] = useState(studioClass?.duration ?? 60);
  const [isRecurring, setIsRecurring] = useState(studioClass?.is_recurring ?? true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      name,
      capacity: Number(capacity),
      day_of_week: dayOfWeek,
      start_time: startTime,
      duration: Number(duration),
      is_recurring: isRecurring,
      ...(instructorOptions ? { instructor_id: Number(instructorId) } : {}),
    };

    try {
      if (studioClass) {
        await api.studioClasses.update(studioClass.id, payload);
      } else {
        await api.studioClasses.create(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save this class.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={isEditing ? "Edit Class" : "New Class"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}
        <Input label="Name" name="name" required value={name} onChange={(e) => setName(e.target.value)} />

        {instructorOptions && (
          <Select
            label="Instructor"
            name="instructor_id"
            required
            value={instructorId}
            onChange={(e) => setInstructorId(e.target.value)}
          >
            {instructorOptions.length === 0 && <option value="">No known instructors yet</option>}
            {instructorOptions.map((instructor) => (
              <option key={instructor.id} value={instructor.id}>
                {instructor.name} (#{instructor.id})
              </option>
            ))}
          </Select>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Day"
            name="day_of_week"
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
          >
            {DAY_OPTIONS.map((day) => (
              <option key={day} value={day}>
                {dayLabel(day)}
              </option>
            ))}
          </Select>
          <Input
            label="Start Time"
            name="start_time"
            type="time"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Capacity"
            name="capacity"
            type="number"
            min={1}
            required
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
          />
          <Input
            label="Duration (min)"
            name="duration"
            type="number"
            min={1}
            required
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Repeats weekly
        </label>

        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
