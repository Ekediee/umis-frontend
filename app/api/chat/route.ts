import { streamText } from 'ai';
import { withLogging } from '@/lib/logger';
import { getAIHandbookContext, getAICurriculumContext } from '../../../lib/ai/handbook-loader';
import { getSessionUser } from "@/lib/session";
import { getClassGroupsAction, getCoursesAction } from '@/app/actions/registration';

// Safely attempt to load the Google AI provider dynamically
let googleProvider: any = null;
try {
  const { google } = require('@ai-sdk/google');
  googleProvider = google;
} catch (e) {
  console.warn("[Gemini Integration] @ai-sdk/google is not available. Running in demo mode.");
}

// Stream live Gemini text deltas as raw, unencoded text chunks
function createLiveRawTextStream(textStream: AsyncIterable<string>): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      try {
        for await (const textDelta of textStream) {
          if (textDelta) {
            controller.enqueue(enc.encode(textDelta));
          }
        }
      } catch (error: any) {
        console.warn("[Gemini Live Stream Error]:", error?.message ?? error);
        const errMsg = error?.message || String(error);
        controller.enqueue(enc.encode(`\n\n*(Error: ${errMsg})*`));
      }
      controller.close();
    }
  });
}

// Stream simulated text for offline/demo fallback
function createOfflineRawTextStream(text: string, delayMs = 15): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const words = text.split(' ');
      for (const word of words) {
        await new Promise(r => setTimeout(r, delayMs));
        controller.enqueue(enc.encode(word + ' '));
      }
      controller.close();
    }
  });
}

const RAW_STREAM_HEADERS = {
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'x-accel-buffering': 'no',
};

export const POST = withLogging(async function POST(req: Request) {
  const body = await req.json();
  const rawMessages = body?.messages ?? [];

  // Convert raw message structures into a clean role-content map for streamText
  const messages = Array.isArray(rawMessages)
    ? rawMessages.map((m: any) => ({
        role: m.role ?? 'user',
        content: typeof m.content === 'string' ? m.content : '',
      }))
    : [];

  // Attempt live Gemini stream if provider + key are available
  if (googleProvider && process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    try {
      const handbookContext = getAIHandbookContext();
      const userData = await getSessionUser();
      
      let curriculumContext = "";
      if (userData) {
        try {
          const groupsResult = await getClassGroupsAction();
          if (groupsResult.data && groupsResult.data.length > 0) {
            // Fetch courses in parallel for all groups to minimize latency
            const groupCourseResults = await Promise.all(
              groupsResult.data.map(async (group) => {
                const coursesResult = await getCoursesAction(group.id);
                return { group, coursesResult };
              })
            );

            let coursesListText = "";
            for (const { group, coursesResult } of groupCourseResults) {
              if (coursesResult.data?.courses && coursesResult.data.courses.length > 0) {
                coursesListText += `### Class Group: ${group.name} (ID: ${group.id})\n`;
                coursesListText += `Student Type: ${coursesResult.data.studentType || '—'}\n\n`;
                coursesListText += `Courses:\n`;
                coursesResult.data.courses.forEach(c => {
                  coursesListText += `- **${c.code}**: ${c.title} (${c.units} credit hours) - Lecturer: ${c.lecturer || '—'} [Level: ${c.level}]\n`;
                });
                coursesListText += `\n`;
              }
            }
            if (coursesListText) {
              curriculumContext = `DYNAMICALLY FETCHED COURSES FOR THE STUDENT:\n\n${coursesListText}`;
            } else {
              curriculumContext = "No courses currently available for registration.";
            }
          } else if (groupsResult.error) {
            console.warn("[Dynamic Course Fetch] Failed to fetch class groups, falling back to static:", groupsResult.error);
            curriculumContext = getAICurriculumContext();
          } else {
            curriculumContext = "No class options or course registration groups were found for this student.";
          }
        } catch (error: any) {
          console.error("[Dynamic Course Fetch Error], falling back to static:", error);
          curriculumContext = getAICurriculumContext();
        }
      } else {
        curriculumContext = getAICurriculumContext();
      }
      
      const studentCgpa = userData?.user_data?.academic_information?.cummulative_gpa ?? null;
      const studentName = userData?.user_data?.personal_information?.student_name ?? null;
      const studentLevel = userData?.user_data?.academic_information?.study_level ?? null;
      const studentDept = userData?.user_data?.department ?? null;

      const studentContext = userData ? `
STUDENT PROFILE CONTEXT:
- Name: ${studentName || "Student"}
- Study Level: ${studentLevel || "—"}
- Department/Major: ${studentDept || "—"}
- Cumulative GPA (CGPA): ${studentCgpa !== null ? studentCgpa.toFixed(2) : "Not available"}
` : "STUDENT PROFILE CONTEXT: No active session found (Guest).";

      const systemPrompt = `You are Babcock University's Student Portal AI Companion & Support Assistant (Pulse).

YOUR CORE PERSUAL & STYLE:
1. **Be a Warm Academic Companion**: Speak gently, with empathy, and in a friendly, encouraging conversational style. Act like a trusted peer or academic mentor.
2. **Encourage and Cheer**: Pay attention to the student's CGPA in their profile context. 
   - Proactively weave warm encouragement regarding their academic standing *naturally* when appropriate during the conversation (e.g. if they talk about registration, workload, or grades). 
   - NEVER dump all their profile context or shout their GPA in the very first generic greeting. Use it contextually.
   - If they have a high GPA (e.g., 3.50+), praise their dedication and cheer them on.
   - If their GPA has room for growth (e.g., below 3.00), offer gentle reassurance and suggest practical tips to improve (like forming peer study groups, office hours, or balanced credit workload).
3. **App Navigation Guide**: Walk students step-by-step through how to do things in the portal (e.g. how to fund their wallet, check grades, pay school fees, or view/download invoices) based on the "App Navigation & Portal UI Workflows" guidelines below.
4. **Engage with Follow-up Questions**: Keep the interaction conversational by occasionally asking friendly follow-up questions (e.g., "Are you feeling good about your course selections this semester?" or "Would you like some study tips to help boost that GPA?").
5. **Formatting & Response Structure**:
   - **Highly Readable with Breaks & Spaces**: Split responses into very short paragraphs separated by double line-breaks (two newlines). Always ensure there are clear breaks and visual spaces between points. Never dump blocks of text together.
   - **Visual Formatting**: Use **bolding** for key terms, course codes, or UI buttons. Use *italics* for warm companion side-remarks.
   - **Lists & Bullet Points**: Always structure guides or tips as clean bullet points or numbered lists, separating items with spacing.
   - **Callouts**: Where appropriate, use markdown blockquotes (\`>\`) to emphasize critical tips or notes (e.g., \`> **Note:** ...\`).
6. **As Short As Necessary & Snappy**: Make responses **as short as necessary**. Keep answers extremely concise, direct, and actionable. Absolutely avoid long-winded introductions, filler phrases, repetitive conclusions, or boilerplate greetings/sign-offs to keep generation speed blazing fast.
7. **Ethics Guardrail**: You are helper and guide. Do NOT assist with or support unethical actions, such as bypassing prerequisite checks, skipping school fee payments, or attempting to manipulate grades/records. Politely decline and explain why.

---
${studentContext}
---
OFFICIAL UNIVERSITY PORTAL & FAQ KNOWLEDGE BASE:
${handbookContext}
---
CURRICULUM & COURSE DATABASE:
${curriculumContext}
---`;

      // Route request to the appropriate model based on query complexity/size
      const lastUserMessage = (messages[messages.length - 1]?.content || "").toLowerCase();
      const requiresAdvancedReasoning = 
        lastUserMessage.includes("gpa") || 
        lastUserMessage.includes("improve") || 
        lastUserMessage.includes("grade") || 
        lastUserMessage.includes("advice") || 
        lastUserMessage.includes("curriculum") || 
        lastUserMessage.includes("course selection") || 
        lastUserMessage.includes("suggest") || 
        lastUserMessage.includes("plan");

      const isSimpleRequest = 
        lastUserMessage.length < 120 && 
        messages.length <= 3 && 
        !requiresAdvancedReasoning;
      
      const modelName = isSimpleRequest ? 'gemini-2.5-flash' : 'gemini-3.5-flash';

      const result = await streamText({
        model: googleProvider(modelName),
        messages,
        system: systemPrompt,
      });

      return new Response(createLiveRawTextStream(result.textStream as unknown as AsyncIterable<string>), {
        headers: RAW_STREAM_HEADERS,
      });
    } catch (error: any) {
      console.warn("[Gemini AI - Offline fallback]:", error?.message ?? error);
      const errMsg = error?.message || String(error);
      const errorResponse = `I encountered an error trying to reach my live AI model:\n\n**Error:** ${errMsg}\n\nPlease check your API key, network connection, or quota.`;
      return new Response(createOfflineRawTextStream(errorResponse), {
        headers: RAW_STREAM_HEADERS,
      });
    }
  }

  // Offline/Demo fallback mode
  const demoText = "Hello! I am your Babcock Pulse Support Companion. I'm running in demo mode right now, but once deployed online with a valid API key, I'll be fully powered by Gemini to help guide you through the portal, check your GPA, and advise you on courses. How are your classes going today?";

  return new Response(createOfflineRawTextStream(demoText), {
    headers: RAW_STREAM_HEADERS,
  });
});
