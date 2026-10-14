"use client";

/** 4.4 Post an announcement → 4.4a sent confirmation. */

import { useState } from "react";
import { CheckCircle2, Megaphone } from "lucide-react";
import { lecturerApi, type CourseSummary } from "@/lib/lecturer/api";
import { useMutation } from "@/lib/lecturer/query";
import { Btn, Checkbox, Field, Input, Textarea, Toggle } from "../ui/primitives";
import { Sheet } from "../ui/sheet";
import { cn } from "@/lib/utils";

const MAX = 1000;

export function AnnounceSheet({ course, open, onClose, defaultGroup }: { course: CourseSummary; open: boolean; onClose: () => void; defaultGroup?: string }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [groups, setGroups] = useState<string[]>([]);
  const [email, setEmail] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [urgent, setUrgent] = useState(false);
  const [sent, setSent] = useState<null | { recipients: number; labels: string[]; held: boolean }>(null);
  const post = useMutation(lecturerApi.postAnnouncement, { invalidates: [`course:${course.id}`, `announcements:${course.id}`] });

  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setGroups(defaultGroup && defaultGroup !== "all" ? [defaultGroup] : course.groups.map((g) => g.id));
      setSent(null);
    }
  }

  const toggleGroup = (id: string, on: boolean) => setGroups((g) => (on ? [...g, id] : g.filter((x) => x !== id)));
  const recipients = course.groups.filter((g) => groups.includes(g.id)).reduce((s, g) => s + g.enrolled, 0);
  const valid = title.trim().length >= 3 && body.trim().length >= 3 && groups.length > 0 && body.length <= MAX;

  const submit = async () => {
    const res = await post.mutate({ courseId: course.id, title: title.trim(), body: body.trim(), groupIds: groups.length === course.groups.length ? [] : groups, alsoEmail: email, pinned, urgent }).catch(() => undefined);
    if (!res) return;
    setSent({ recipients: res.announcement.recipients, labels: res.groupLabels, held: res.heldUntil0600 });
    setTitle("");
    setBody("");
  };

  if (sent) {
    return (
      <Sheet open={open} onClose={onClose} title="Announcement sent" size="sm" footer={<Btn onClick={onClose}>Done</Btn>}>
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <CheckCircle2 className="size-12 text-emerald-500" />
          <p className="text-[16px] font-semibold text-gray-900 dark:text-gray-100">
            Sent to {sent.recipients} students in {course.code} ({sent.labels.join(", ")}).
          </p>
          <p className="text-[13px] text-gray-500">
            {sent.held ? "It's quiet hours, so push is held until 06:00. " : ""}You&apos;ll see how many students have seen it after an hour.
          </p>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      dismissible={!post.pending}
      title="Post an announcement"
      description="Everyone in the chosen groups gets a push notification. Use Q&A for questions others might share."
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancel
          </Btn>
          <Btn icon={Megaphone} onClick={submit} loading={post.pending} disabled={!valid}>
            Post to {recipients} students
          </Btn>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Title" htmlFor="ann-title">
          <Input id="ann-title" data-autofocus value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="e.g. CA 2 brief is up" />
        </Field>
        <Field label="Message" htmlFor="ann-body" hint={<span className={cn(body.length > MAX && "text-red-600")}>{body.length} / {MAX} characters · plain text</span>}>
          <Textarea id="ann-body" value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="What do students need to know?" />
        </Field>
        {course.groups.length > 1 && (
          <fieldset>
            <legend className="mb-1 text-[13px] font-semibold text-gray-800 dark:text-gray-200">Groups</legend>
            <div className="flex flex-wrap gap-x-4">
              {course.groups.map((g) => (
                <label key={g.id} className="flex items-center text-[14px] text-gray-700 dark:text-gray-300">
                  <Checkbox checked={groups.includes(g.id)} onChange={(v) => toggleGroup(g.id, v)} label={g.option} />
                  {g.label.length <= 2 ? `Group ${g.label}` : g.label} <span className="ml-1 text-gray-400">({g.enrolled})</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 px-4 dark:divide-gray-800 dark:border-gray-800">
          <Toggle id="ann-email" checked={email} onChange={setEmail} label="Also send by email" />
          <Toggle id="ann-pin" checked={pinned} onChange={setPinned} label="Pin to top" />
          <Toggle id="ann-urgent" checked={urgent} onChange={setUrgent} label="Urgent" description="Sends during quiet hours (22:00 to 06:00)" />
        </div>
        {post.error && <p className="text-[13px] text-red-600">{post.error.message}</p>}
      </div>
    </Sheet>
  );
}
