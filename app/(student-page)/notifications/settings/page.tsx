"use client";

import { useEffect, useState } from "react";
import { BellRing, BookOpen, CalendarDays, ClipboardCheck, Info, ListTodo, Minus, Moon, Newspaper, Plus, Smartphone, Wallet, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { BackLink, ErrorPanel, IconBubble, PageContainer, PanelSkeleton, Toggle, type Tone } from "@/components/student/ui";
import { studentApi } from "@/lib/student/api";
import { useStudentQuery } from "@/lib/student/query";
import { writeCachedPrefs } from "@/lib/student/notification-prefs";
import { currentSubscription, disablePush, enablePush, pushSupport, type PushSupport } from "@/lib/student/push";
import type { NotificationCategory, NotificationPrefs } from "@/lib/student/types";
import { cn } from "@/lib/utils";

const CATEGORIES: { id: NotificationCategory; icon: LucideIcon; tone: Tone; title: string; body: string }[] = [
  { id: "courses", icon: BookOpen, tone: "blue", title: "Courses", body: "Announcements, venue changes, cancellations, new materials and answers to your questions" },
  { id: "attendance", icon: ClipboardCheck, tone: "green", title: "Attendance", body: "Check-in reminders and warnings before you drop below 75%" },
  { id: "fees", icon: Wallet, tone: "sky", title: "Fees and payments", body: "Payment confirmations, deadlines and clearance updates" },
  { id: "registration", icon: ListTodo, tone: "purple", title: "Registration", body: "When registration opens, closes, and when your adviser approves it" },
  { id: "events", icon: CalendarDays, tone: "amber", title: "Events", body: "Campus events you might like, from your department and clubs" },
  { id: "system", icon: Newspaper, tone: "gray", title: "Pulse updates", body: "New features and important account notices" },
];

/** Grouped settings card (Perplexity / Shopify pattern), in the product's card style. */
function Group({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="text-[11px] md:text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">{title}</h3>
      <div className="bg-white dark:bg-gray-900 rounded-[20px] border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">{children}</div>
      {note && <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-2 px-1 leading-relaxed">{note}</p>}
    </section>
  );
}

function Row({ icon, tone, title, body, children }: { icon?: LucideIcon; tone?: Tone; title: string; body?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 md:gap-4 px-4 md:px-5 py-4">
      {icon && <IconBubble icon={icon} tone={tone} size="sm" />}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] md:text-[15px] font-semibold text-gray-900 dark:text-gray-100">{title}</p>
        {body && <div className="text-[12px] md:text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">{body}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

const PUSH_COPY: Record<Exclude<PushSupport, "supported">, string> = {
  "ios-install": "On iPhone, add Pulse to your Home Screen first (Share, then Add to Home Screen). Apple only allows notifications for installed web apps.",
  unsupported: "This browser doesn't support push notifications. You'll still see everything in your inbox.",
  "not-configured": "Push notifications aren't switched on for this server yet. You'll still see everything in your inbox.",
  "no-service-worker": "Push needs the installed app.",
};

export default function NotificationSettingsPage() {
  const q = useStudentQuery("notification-prefs", studentApi.getNotificationPrefs);
  const [support, setSupport] = useState<PushSupport>("unsupported");
  const [pushOn, setPushOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    // Both read browser-only APIs, so they resolve after mount (async, no hydration mismatch).
    currentSubscription().then((s) => {
      setSupport(pushSupport());
      setPushOn(!!s);
    });
  }, []);

  useEffect(() => {
    if (q.data) writeCachedPrefs(q.data);
  }, [q.data]);

  const save = async (patch: Partial<NotificationPrefs>) => {
    const prev = q.data;
    if (!prev) return;
    const next = { ...prev, ...patch, categories: { ...prev.categories, ...(patch.categories ?? {}) }, quietHours: { ...prev.quietHours, ...(patch.quietHours ?? {}) } };
    q.setData(() => next);
    writeCachedPrefs(next);
    try {
      await studentApi.saveNotificationPrefs(patch);
    } catch {
      q.setData(() => prev);
      writeCachedPrefs(prev);
      toast.error("Couldn't save that setting. Try again.");
    }
  };

  const togglePush = async (on: boolean) => {
    setPushBusy(true);
    try {
      if (on) {
        await enablePush();
        toast.success("Push notifications are on for this device");
      } else {
        await disablePush();
        toast.message("Push notifications are off for this device");
      }
      setPushOn(on);
      await save({ push: on });
    } catch (e) {
      toast.error((e as Error).message || "Couldn't change push notifications.");
    } finally {
      setPushBusy(false);
    }
  };

  const p = q.data;

  return (
    <PageContainer className="max-w-[760px]">
      <div className="flex items-center justify-between mb-6">
        <BackLink href="/notifications">Notifications</BackLink>
      </div>
      <h2 className="text-[22px] font-bold text-gray-900 dark:text-gray-100 mb-1">Notification settings</h2>
      <p className="text-[14px] text-gray-500 dark:text-gray-400 mb-6">Choose what reaches you and when. Your inbox always keeps a copy of everything you leave on.</p>

      {q.error && !p ? (
        <ErrorPanel error={q.error} onRetry={q.refetch} />
      ) : !p ? (
        <div className="flex flex-col gap-6">
          <PanelSkeleton rows={2} />
          <PanelSkeleton rows={4} />
        </div>
      ) : (
        <>
          <Group title="This device" note={support !== "supported" ? PUSH_COPY[support] : "Urgent alerts, like a cancelled class or a closing deadline, always come through."}>
            <Row icon={Smartphone} tone="blue" title="Push notifications" body="Get alerts on this phone or computer, even when Pulse is closed.">
              <Toggle checked={pushOn} onChange={togglePush} disabled={support !== "supported" || pushBusy} label="Push notifications" />
            </Row>
          </Group>

          <Group title="What to notify me about">
            {CATEGORIES.map((c) => (
              <Row key={c.id} icon={c.icon} tone={c.tone} title={c.title} body={c.body}>
                <Toggle checked={p.categories[c.id]} onChange={(v) => save({ categories: { ...p.categories, [c.id]: v } })} label={c.title} />
              </Row>
            ))}
          </Group>

          <Group title="When" note="Quiet hours and the daily limit hold back non-urgent alerts; they still land in your inbox.">
            <Row icon={Moon} tone="purple" title="Quiet hours" body={p.quietHours.enabled ? `No non-urgent alerts from ${p.quietHours.start} to ${p.quietHours.end}` : "Off"}>
              <Toggle checked={p.quietHours.enabled} onChange={(v) => save({ quietHours: { ...p.quietHours, enabled: v } })} label="Quiet hours" />
            </Row>
            {p.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-3 px-4 md:px-5 py-4 bg-[#f9fafb] dark:bg-gray-800/40 animate-in fade-in duration-200">
                {(["start", "end"] as const).map((k) => (
                  <label key={k} className="flex flex-col gap-1.5">
                    <span className="text-[12px] font-semibold text-gray-500 dark:text-gray-400">{k === "start" ? "From" : "Until"}</span>
                    <input
                      type="time"
                      value={p.quietHours[k]}
                      onChange={(e) => e.target.value && save({ quietHours: { ...p.quietHours, [k]: e.target.value } })}
                      className="h-11 rounded-[12px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-[15px] font-semibold text-gray-900 dark:text-gray-100 outline-none focus:border-[#003cbb] dark:focus:border-[#4d82ff] focus:ring-3 focus:ring-[#003cbb]/10"
                    />
                  </label>
                ))}
              </div>
            )}
            <Row icon={BellRing} tone="amber" title="Daily limit" body="Most non-urgent alerts per day">
              <div className="flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 p-1">
                <button type="button" aria-label="Fewer" disabled={p.dailyCap <= 1} onClick={() => save({ dailyCap: p.dailyCap - 1 })} className="w-8 h-8 rounded-full inline-flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-7 text-center text-[15px] font-bold tabular-nums text-gray-900 dark:text-gray-100" aria-live="polite">
                  {p.dailyCap}
                </span>
                <button type="button" aria-label="More" disabled={p.dailyCap >= 20} onClick={() => save({ dailyCap: p.dailyCap + 1 })} className="w-8 h-8 rounded-full inline-flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </Row>
            <Row icon={Newspaper} tone="sky" title="Daily digest" body="Bundle non-urgent alerts into one summary each evening">
              <Toggle checked={p.dailyDigest} onChange={(v) => save({ dailyDigest: v })} label="Daily digest" />
            </Row>
          </Group>

          <p className={cn("flex items-start gap-2 text-[12px] text-gray-400 dark:text-gray-500 px-1")}>
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Settings apply to every device you use Pulse on.
          </p>
        </>
      )}
    </PageContainer>
  );
}
