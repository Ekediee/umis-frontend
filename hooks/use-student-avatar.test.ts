import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { UMISResponse } from "@/lib/session";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/dashboard"),
}));

// Mock user context
const contextUserDataMock = {
  entity_id: "1",
  entity_name: "John Doe",
  user_data: {
    matric_number: "18/0654",
    personal_information: {
      student_name: "John Doe",
      matric_number: "18/0654",
      profile_picture_url: "https://backend.test.com/images/john.png",
    },
  },
};

const useUserDataMock = vi.fn(() => contextUserDataMock);
vi.mock("@/contexts/user-data-context", () => ({
  useUserData: () => useUserDataMock(),
}));

// Mock user profile action
const getStudentProfileActionMock = vi.fn();
vi.mock("@/app/actions/user", () => ({
  getStudentProfileAction: () => getStudentProfileActionMock(),
}));

import {
  useStudentAvatar,
  extractPicUrl,
  proxyImageUrl,
  DEFAULT_AVATAR,
} from "@/hooks/use-student-avatar";

describe("useStudentAvatar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    getStudentProfileActionMock.mockResolvedValue(null);
  });

  describe("proxyImageUrl", () => {
    it("returns direct string for local static assets or data URLs", () => {
      expect(proxyImageUrl("/images/avatar.png")).toBe("/images/avatar.png");
      expect(proxyImageUrl("data:image/png;base64,123")).toBe(
        "data:image/png;base64,123"
      );
    });

    it("proxies relative backend paths through /api/image-proxy", () => {
      const relative = "/storage/profile_pictures/18_0654.jpg";
      expect(proxyImageUrl(relative)).toContain("/api/image-proxy?url=");
      expect(proxyImageUrl(relative)).toContain(encodeURIComponent("storage/profile_pictures/18_0654.jpg"));
    });

    it("proxies remote backend URLs through /api/image-proxy", () => {
      const remote = "https://backend.babcock.edu.ng/photo.jpg";
      expect(proxyImageUrl(remote)).toBe(
        `/api/image-proxy?url=${encodeURIComponent(remote)}`
      );
    });
  });

  describe("extractPicUrl", () => {
    it("returns null for empty or invalid data", () => {
      expect(extractPicUrl(null)).toBeNull();
      expect(extractPicUrl(undefined)).toBeNull();
    });

    it("extracts nested personal_information profile_picture_url", () => {
      const url = extractPicUrl(contextUserDataMock as unknown as UMISResponse);
      expect(url).toBe("https://backend.test.com/images/john.png");
    });
  });

  describe("useStudentAvatar hook", () => {
    it("returns proxied avatar URL from context and sets up per-user cache", async () => {
      const { result } = renderHook(() => useStudentAvatar());

      expect(result.current.avatarUrl).toBe(
        `/api/image-proxy?url=${encodeURIComponent(
          "https://backend.test.com/images/john.png"
        )}`
      );
      expect(localStorage.getItem("profile_avatar:18/0654")).toBe(
        "https://backend.test.com/images/john.png"
      );
    });

    it("resets avatar to DEFAULT_AVATAR if setAvatarUrl is called on error", () => {
      const { result } = renderHook(() => useStudentAvatar());

      act(() => {
        result.current.setAvatarUrl(DEFAULT_AVATAR);
      });

      expect(result.current.avatarUrl).toBe(DEFAULT_AVATAR);
    });

    it("updates avatar when custom event 'profile_avatar_updated' is dispatched", () => {
      const { result } = renderHook(() => useStudentAvatar());

      act(() => {
        window.dispatchEvent(
          new CustomEvent("profile_avatar_updated", {
            detail: { url: "/images/new-uploaded-avatar.png" },
          })
        );
      });

      expect(result.current.avatarUrl).toBe("/images/new-uploaded-avatar.png");
    });
  });
});
