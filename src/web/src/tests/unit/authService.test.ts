import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { authService } from "../../services/authService";

describe("authService", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("register", () => {
    const payload = {
      firstName: "Tafadzwa",
      lastName: "Musiiwa",
      email: "tafadzwa@up.ac.za",
      university: "University of Pretoria",
      degreeProgram: "Computer Science",
      yearOfStudy: "3",
      password: "Password123!",
    };

    it("should resolve when registration succeeds", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis.fetch as any).mockResolvedValueOnce({ ok: true });

      await expect(authService.register(payload)).resolves.toBeUndefined();

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/register"),
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      );
    });

    it("should throw the server error message when registration fails", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "email_taken" }),
      });

      await expect(authService.register(payload)).rejects.toThrow("email_taken");
    });

    it("should throw a default error when registration fails without an error body", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(authService.register(payload)).rejects.toThrow("server_error");
    });
  });

  describe("verifyOtp", () => {
    it("should resolve when OTP verification succeeds", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis.fetch as any).mockResolvedValueOnce({ ok: true });

      await expect(
        authService.verifyOtp("tafadzwa@up.ac.za", "123456")
      ).resolves.toBeUndefined();

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/verify-otp"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "tafadzwa@up.ac.za", otp: "123456" }),
        })
      );
    });

    it("should throw the server error message when OTP verification fails", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "invalid_otp" }),
      });

      await expect(
        authService.verifyOtp("tafadzwa@up.ac.za", "000000")
      ).rejects.toThrow("invalid_otp");
    });
  });

  describe("resendOtp", () => {
    it("should resolve when resending OTP succeeds", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis.fetch as any).mockResolvedValueOnce({ ok: true });

      await expect(authService.resendOtp("tafadzwa@up.ac.za")).resolves.toBeUndefined();

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/resend-otp"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "tafadzwa@up.ac.za" }),
        })
      );
    });

    it("should throw the server error message when resending OTP fails", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "too_many_requests" }),
      });

      await expect(authService.resendOtp("tafadzwa@up.ac.za")).rejects.toThrow(
        "too_many_requests"
      );
    });
  });

  describe("login", () => {
    const payload = { Email: "tafadzwa@up.ac.za", Password: "Password123!" };

    it("should resolve when login succeeds", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis.fetch as any).mockResolvedValueOnce({ ok: true });

      await expect(authService.login(payload)).resolves.toBeUndefined();

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/login"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(payload),
        })
      );
    });

    it("should throw the server error message when login fails", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "invalid_credentials" }),
      });

      await expect(authService.login(payload)).rejects.toThrow("invalid_credentials");
    });
  });

  describe("getMe", () => {
    it("should return the user payload when authenticated", async () => {
      const mockResponse = {
        user: {
          userId: "1",
          firstName: "Tafadzwa",
          lastName: "Musiiwa",
          email: "tafadzwa@up.ac.za",
          userRole: "student",
        },
        std: { verificationStatus: "verified" },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await expect(authService.getMe()).resolves.toEqual(mockResponse);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/me"),
        expect.objectContaining({ credentials: "include" })
      );
    });

    it("should throw 'unauthenticated' when the session is invalid", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis.fetch as any).mockResolvedValueOnce({ ok: false });

      await expect(authService.getMe()).rejects.toThrow("unauthenticated");
    });
  });

  describe("logout", () => {
    it("should call the logout endpoint", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis.fetch as any).mockResolvedValueOnce({ ok: true });

      await authService.logout();

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/logout"),
        expect.objectContaining({
          method: "POST",
          credentials: "include",
        })
      );
    });

    it("should not throw even if the logout response is not ok", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis.fetch as any).mockResolvedValueOnce({ ok: false });

      await expect(authService.logout()).resolves.toBeUndefined();
    });
  });

  describe("getUniversities", () => {
    it("should return the universities list on success", async () => {
      const mockUniversities = [
        { universityId: "1", name: "University of Pretoria", emailDomain: "up.ac.za" },
      ];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockUniversities }),
      });

      await expect(authService.getUniversities()).resolves.toEqual(mockUniversities);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/universities"),
        expect.objectContaining({ method: "GET", credentials: "include" })
      );
    });

    it("should return an empty array when data is missing from the response", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await expect(authService.getUniversities()).resolves.toEqual([]);
    });

    it("should throw the error message when the request fails", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Failed to load Universities" }),
      });

      await expect(authService.getUniversities()).rejects.toThrow(
        "Failed to load Universities"
      );
    });

    it("should throw a default error when the failure response body can't be parsed", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => {
          throw new Error("not json");
        },
      });

      await expect(authService.getUniversities()).rejects.toThrow(
        "Failed to load Universities"
      );
    });
  });
});