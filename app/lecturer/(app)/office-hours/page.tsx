"use client";

/** 8.1 Set office hours · 8.2 bookings · 8.2a cancel hours · 8.3 meeting notes · pause for exam weeks. */

import { useState } from "react";
import { CalendarX2, Clock3, MapPin, NotebookPen, Plus, Trash2, Video } from "lucide-react";
import { toast } from "sonner";
import { lecturerApi } from "@/lib/lecturer/api";
import { appNow } from "@/lib/lecturer/clock";
import { WEEKDAYS_LONG, dayDate, daysBetween, fullName, plural, timeRange } from "@/lib/lecturer/format";
import { useLecturerQuery, useMutation } from "@/lib/lecturer/query";
import type { Booking, OfficeHourSlot } from "@/lib/lecturer/types";
import { Page } from "@/components/lecturer/shell/page";
import { Btn, CardSkeleton, Chip, ErrorState, Field, Input, PageHeader, PersonAvatar, SectionTitle, Select, Surface, Textarea, Toggle } from "@/components/lecturer/ui/primitives";
import { Sheet } from "@/components/lecturer/ui/sheet";

const AUDIENCE: Record<OfficeHourSlot["audience"], string> = { "my-students": "My students", advisees: "Advisees", supervisees: "Supervisees", anyone: "Anyone" };

export default function OfficeHoursPage() {
  const q = useLecturerQuery("officehours", () => lecturerApi.getOfficeHours());
  const save = useMutation(lecturerApi.saveOfficeHours, { invalidates: ["officehours", "schedule:"] });
  const [draft, setDraft] = useState<{ slots: OfficeHourSlot[]; paused: boolean } | null>(null);
  const dirty = draft !== null;
  const slots = draft?.slots ?? q.data?.slots ?? [];
  const paused = draft?.paused ?? q.data?.paused ?? false;
  const setSlots = (fn: (s: OfficeHourSlot[]) => OfficeHourSlot[]) => setDraft({ slots: fn(slots), paused });
  const setPaused = (v: boolean) => setDraft({ slots, paused: v });
  const setDirty = (v: boolean) => !v && setDraft(null);
  const [cancelSlot, setCancelSlot] = useState<OfficeHourSlot | null>(null);
  const [notesFor, setNotesFor] = useState<Booking | null>(null);
  const now = appNow();


  const update = (id: string, patch: Partial<OfficeHourSlot>) => {
    setSlots((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    setDirty(true);
  };

  if (q.error)
    return (
      <Page>
        <ErrorState error={q.error} screen="Office hours" onRetry={q.refetch} />
      </Page>
    );
  if (!q.data)
    return (
      <Page>
        <CardSkeleton rows={4} />
      </Page>
    );

  const today = q.data.bookings.filter((b) => daysBetween(b.date, now) === 0);
  const upcoming = q.data.bookings.filter((b) => daysBetween(b.date, now) > 0);

  return (
    <Page>
      <PageHeader title="Office hours" description="Students book short slots instead of waiting outside your office. Clashes with your classes are blocked." />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-5">
          <Surface>
            <SectionTitle title="Today" count={today.length} />
            {today.length === 0 ? (
              <p className="text-[14px] text-gray-500">No bookings today.</p>
            ) : (
              <BookingList bookings={today} onNotes={setNotesFor} />
            )}
          </Surface>
          <Surface>
            <SectionTitle title="Upcoming" count={upcoming.length} />
            {upcoming.length === 0 ? <p className="text-[14px] text-gray-500">No upcoming bookings.</p> : <BookingList bookings={upcoming} onNotes={setNotesFor} showDate />}
          </Surface>
        </div>

        <Surface className="flex flex-col gap-4 self-start">
          <SectionTitle
            title="Weekly slots"
            action={
              <Btn
                size="sm"
                variant="secondary"
                icon={Plus}
                onClick={() => {
                  setSlots((s) => [...s, { id: `oh-${Date.now()}`, day: 1, start: "14:00", end: "15:00", slotMinutes: 15, location: q.data!.slots[0]?.location ?? "", audience: "my-students" }]);
                  setDirty(true);
                }}
              >
                Add
              </Btn>
            }
          />
          <Toggle id="pause" checked={paused} onChange={(v) => (setPaused(v), setDirty(true))} label="Pause bookings" description="For exam weeks. Existing bookings stay." />
          {slots.map((s) => (
            <div key={s.id} className="flex flex-col gap-3 rounded-2xl border border-gray-100 p-3 dark:border-gray-800">
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Select value={s.day} onChange={(e) => update(s.id, { day: Number(e.target.value) })} aria-label="Day">
                  {WEEKDAYS_LONG.slice(0, 6).map((d, i) => (
                    <option key={d} value={i + 1}>
                      {d}
                    </option>
                  ))}
                </Select>
                <button type="button" aria-label="Remove slot" onClick={() => (setSlots((x) => x.filter((y) => y.id !== s.id)), setDirty(true))} className="inline-flex size-11 items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40">
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input type="time" value={s.start} onChange={(e) => update(s.id, { start: e.target.value })} aria-label="Start" />
                <Input type="time" value={s.end} onChange={(e) => update(s.id, { end: e.target.value })} aria-label="End" />
                <Select value={s.slotMinutes} onChange={(e) => update(s.id, { slotMinutes: Number(e.target.value) })} aria-label="Slot length">
                  {[10, 15, 20, 30].map((m) => (
                    <option key={m} value={m}>
                      {m} min
                    </option>
                  ))}
                </Select>
              </div>
              <Input value={s.online ?? s.location} onChange={(e) => update(s.id, e.target.value.startsWith("http") ? { online: e.target.value, location: "Online" } : { location: e.target.value, online: undefined })} placeholder="Room, or an online link" aria-label="Location or link" />
              <div className="flex items-center justify-between gap-2">
                <Select value={s.audience} onChange={(e) => update(s.id, { audience: e.target.value as OfficeHourSlot["audience"] })} aria-label="Who can book" className="h-9 text-[13px]">
                  {Object.entries(AUDIENCE).map(([k, v]) => (
                    <option key={k} value={k}>
                      Who can book: {v}
                    </option>
                  ))}
                </Select>
                <Btn size="sm" variant="ghost" icon={CalendarX2} onClick={() => setCancelSlot(s)}>
                  Cancel next
                </Btn>
              </div>
            </div>
          ))}
          <Btn
            disabled={!dirty}
            loading={save.pending}
            onClick={async () => {
              try {
                await save.mutate({ slots, paused });
                setDirty(false);
                toast.success("Office hours saved", { description: "Students see open slots on your staff page and course pages." });
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}
          >
            Save slots
          </Btn>
        </Surface>
      </div>

      <CancelSheet slot={cancelSlot} bookings={q.data.bookings} onClose={() => setCancelSlot(null)} />
      <NotesSheet booking={notesFor} onClose={() => setNotesFor(null)} />
    </Page>
  );
}

function BookingList({ bookings, onNotes, showDate }: { bookings: Booking[]; onNotes: (b: Booking) => void; showDate?: boolean }) {
  return (
    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
      {bookings.map((b) => (
        <li key={b.id} className="flex items-center gap-3 py-3">
          <PersonAvatar first={b.student.firstName} last={b.student.lastName} size={40} />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">{fullName(b.student)}</p>
            <p className="text-[13px] text-gray-500">
              {showDate && `${dayDate(b.date)} · `}
              {timeRange(b.start, b.end)} · {b.topic}
            </p>
            {b.note && <p className="mt-0.5 text-[13px] text-gray-700 italic dark:text-gray-300">“{b.note}”</p>}
          </div>
          <Btn size="sm" variant="ghost" icon={NotebookPen} onClick={() => onNotes(b)}>
            Notes
          </Btn>
        </li>
      ))}
    </ul>
  );
}

function CancelSheet({ slot, bookings, onClose }: { slot: OfficeHourSlot | null; bookings: Booking[]; onClose: () => void }) {
  const [message, setMessage] = useState("");
  const cancel = useMutation(lecturerApi.cancelBookings, { invalidates: ["officehours", "today:"] });
  const affected = slot ? bookings.filter((b) => new Date(b.date).getDay() === slot.day % 7 && b.start >= slot.start && b.start < slot.end) : [];
  return (
    <Sheet
      open={!!slot}
      onClose={onClose}
      size="sm"
      title={slot ? `Cancel ${WEEKDAYS_LONG[slot.day - 1]} ${timeRange(slot.start, slot.end)}?` : ""}
      description={`${plural(affected.length, "student")} booked. They're notified and offered your next free slot.`}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Keep
          </Btn>
          <Btn
            variant="danger"
            loading={cancel.pending}
            onClick={async () => {
              const r = await cancel.mutate(affected.map((b) => b.id), message).catch(() => undefined);
              if (r) toast.success(`Cancelled. ${plural(r.notified, "student")} notified.`);
              onClose();
            }}
          >
            Cancel hours
          </Btn>
        </>
      }
    >
      <Field label="Message" htmlFor="oh-msg" optional>
        <Textarea id="oh-msg" value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="e.g. I'm invigilating. Please rebook for Friday." />
      </Field>
    </Sheet>
  );
}

function NotesSheet({ booking, onClose }: { booking: Booking | null; onClose: () => void }) {
  const [note, setNote] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [share, setShare] = useState(false);
  return (
    <Sheet
      open={!!booking}
      onClose={onClose}
      title={booking ? `Notes · ${fullName(booking.student)}` : ""}
      description="Private by default. For advisees, the note joins their advisee profile."
      footer={
        <>
          <Btn variant="ghost" onClick={() => toast.info("Student affairs referral", { description: "Opens the university's referral contact. The note is not stored in Pulse." })}>
            Refer to student affairs
          </Btn>
          <Btn
            disabled={note.trim().length < 3}
            onClick={() => {
              // TODO(api): POST /lecturer/office-hours/bookings/:id/notes
              toast.success(share ? "Notes saved and shared with the student" : "Notes saved privately");
              setNote("");
              setFollowUp("");
              onClose();
            }}
          >
            Save
          </Btn>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {booking && (
          <p className="flex flex-wrap items-center gap-3 text-[13px] text-gray-500">
            <span className="inline-flex items-center gap-1">
              <Clock3 className="size-3.5" /> {dayDate(booking.date)}, {timeRange(booking.start, booking.end)}
            </span>
            <Chip tone="neutral" icon={booking.topic === "Online" ? Video : MapPin} noIcon>
              {booking.topic}
            </Chip>
          </p>
        )}
        <Field label="What did you discuss?" htmlFor="nt-note">
          <Textarea id="nt-note" data-autofocus value={note} onChange={(e) => setNote(e.target.value)} rows={4} />
        </Field>
        <Field label="Follow-up task" htmlFor="nt-fu" optional>
          <Input id="nt-fu" value={followUp} onChange={(e) => setFollowUp(e.target.value)} placeholder="e.g. Check CA 1 script again by Friday" />
        </Field>
        <Toggle id="nt-share" checked={share} onChange={setShare} label="Share notes with student" />
      </div>
    </Sheet>
  );
}
