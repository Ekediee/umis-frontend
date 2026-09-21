import { describe, it, expect } from "vitest";
import {
  DEFAULT_ALLOWED_DOMAINS,
  getAllowedDomains,
  getEmailDomain,
  isAllowedEmailDomain,
  isConsistentHostedDomain,
} from "./email-domain";

describe("getAllowedDomains", () => {
  it("defaults to babcock.edu.ng when unset or blank", () => {
    expect(getAllowedDomains(undefined)).toEqual(DEFAULT_ALLOWED_DOMAINS);
    expect(getAllowedDomains("  , ")).toEqual(DEFAULT_ALLOWED_DOMAINS);
  });

  it("parses, trims, lowercases and strips a leading @", () => {
    expect(getAllowedDomains(" @Student.Babcock.edu.ng , pg.babcock.edu.ng ")).toEqual([
      "student.babcock.edu.ng",
      "pg.babcock.edu.ng",
    ]);
  });
});

describe("isAllowedEmailDomain", () => {
  const allowed = ["babcock.edu.ng"];

  it.each([
    "a@babcock.edu.ng",
    "a@student.babcock.edu.ng",
    "a@pg.babcock.edu.ng",
    "A.B@Student.Babcock.edu.ng",
    "  a@student.babcock.edu.ng  ",
  ])("accepts %s", (email) => {
    expect(isAllowedEmailDomain(email, allowed)).toBe(true);
  });

  it.each([
    "a@evilbabcock.edu.ng", // suffix without the dot boundary
    "a@babcock.edu.ng.evil.io", // allowed domain as a prefix
    "a@evil.io/babcock.edu.ng",
    "a@gmail.com",
    "a@babcock.edu.ng@evil.io", // multiple @
    "a@b@babcock.edu.ng",
    "@babcock.edu.ng", // no local part
    "a@babcock.edu", // truncated
    "a@bаbcock.edu.ng", // Cyrillic "а" look-alike
  ])("rejects %s", (email) => {
    expect(isAllowedEmailDomain(email, allowed)).toBe(false);
  });

  it("rejects non-strings and empty values", () => {
    expect(isAllowedEmailDomain(undefined, allowed)).toBe(false);
    expect(isAllowedEmailDomain(null, allowed)).toBe(false);
    expect(isAllowedEmailDomain("", allowed)).toBe(false);
    expect(isAllowedEmailDomain(42, allowed)).toBe(false);
  });

  it("can be narrowed to student subdomains only", () => {
    const studentsOnly = ["student.babcock.edu.ng", "pg.babcock.edu.ng"];
    expect(isAllowedEmailDomain("a@student.babcock.edu.ng", studentsOnly)).toBe(true);
    expect(isAllowedEmailDomain("a@babcock.edu.ng", studentsOnly)).toBe(false);
  });
});

describe("getEmailDomain", () => {
  it("returns the lowercase host", () => {
    expect(getEmailDomain("A@Student.Babcock.edu.ng")).toBe("student.babcock.edu.ng");
  });
  it("returns null for malformed input", () => {
    expect(getEmailDomain("nope")).toBeNull();
    expect(getEmailDomain("a@localhost")).toBeNull();
  });
});

describe("isConsistentHostedDomain", () => {
  it("accepts hd equal to, or a parent of, the email domain", () => {
    expect(isConsistentHostedDomain("babcock.edu.ng", "a@babcock.edu.ng")).toBe(true);
    expect(isConsistentHostedDomain("babcock.edu.ng", "a@student.babcock.edu.ng")).toBe(true);
    expect(isConsistentHostedDomain("student.babcock.edu.ng", "a@student.babcock.edu.ng")).toBe(true);
  });

  it("rejects a missing, unrelated or narrower hd", () => {
    expect(isConsistentHostedDomain(undefined, "a@babcock.edu.ng")).toBe(false);
    expect(isConsistentHostedDomain("evil.io", "a@babcock.edu.ng")).toBe(false);
    expect(isConsistentHostedDomain("student.babcock.edu.ng", "a@babcock.edu.ng")).toBe(false);
    expect(isConsistentHostedDomain("evilbabcock.edu.ng", "a@babcock.edu.ng")).toBe(false);
  });
});
