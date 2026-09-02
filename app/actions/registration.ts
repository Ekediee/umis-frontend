/**
 * @file registration.ts — Barrel re-export
 *
 * This file previously contained all registration server actions in a single
 * 898-line monolith. It has been refactored into focused domain files:
 *
 *   registration-class-groups.ts  — ClassGroup, getClassGroupsAction
 *   registration-courses.ts       — CourseItem, getCoursesAction, submitCourseSelectionAction,
 *                                   getRegisteredCoursesAction, getWorshipCentersAction
 *   registration-semester.ts      — SemesterInfo, getSemesterRegistrationStatusAction, registerSemesterAction
 *   registration-finance.ts       — FinanceRegistrationData, getFinanceRegistrationAction
 *
 * All existing import paths (e.g. "@/app/actions/registration") remain valid
 * — this barrel re-exports everything, so no consumer needs to be updated.
 */

export * from "./registration-class-groups";
export * from "./registration-courses";
export * from "./registration-semester";
export * from "./registration-finance";
