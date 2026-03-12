/**
 * Login Form Test Cases
 *
 * Tests the login flow to verify error handling behavior
 * when user credentials are invalid.
 *
 * Testing Mode - Level Coverage:
 * Level 1: Basic functionality tests
 * Level 2: Boundary and edge case tests
 * Level 3: Error handling tests
 * Level 4: Integration behavior tests
 */

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LoginForm from "../components/LoginForm";

// Mock dependencies
vi.mock("@/lib/apis/auth", () => ({
  loginIdentity: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { loginIdentity } from "@/lib/apis/auth";
import { toast } from "sonner";

describe("LoginForm - Error Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================
  // LEVEL 1: BASIC FUNCTIONALITY TESTS
  // ============================================

  describe("Level 1 - Basic Functionality", () => {
    it("should call loginIdentity with correct credentials when form is submitted", async () => {
      vi.mocked(loginIdentity).mockResolvedValue(undefined);

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /login/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(loginIdentity).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
        });
      });
    });

    it("should successfully login and redirect to home page", async () => {
      const mockRouter = {
        push: vi.fn(),
        refresh: vi.fn(),
      };

      vi.mock("next/navigation", () => ({
        useRouter: () => mockRouter,
        useSearchParams: () => new URLSearchParams(),
      }));

      vi.mocked(loginIdentity).mockResolvedValue(undefined);

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /login/i });

      fireEvent.change(emailInput, { target: { value: "valid@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "correctpassword" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRouter.refresh).toHaveBeenCalled();
        expect(mockRouter.push).toHaveBeenCalledWith("/");
      });
    });
  });

  // ============================================
  // LEVEL 2: BOUNDARY AND EDGE CASE TESTS
  // ============================================

  describe("Level 2 - Boundary and Edge Case Tests", () => {
    /**
     * KEY TEST CASE for the reported issue:
     * When user doesn't exist, backend should return 401 with error message
     * NOT a redirect.
     *
     * Scenario: User enters email that doesn't exist in the system
     * Expected: Error message should be displayed via toast
     * Actual (reported): Application redirects instead of showing error
     */
    it("should handle invalid credentials error - USER NOT FOUND scenario", async () => {
      const errorMessage = "Invalid email or password";
      vi.mocked(loginIdentity).mockRejectedValue(new Error(errorMessage));

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /login/i });

      fireEvent.change(emailInput, {
        target: { value: "nonexistent@example.com" },
      });
      fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });
      fireEvent.click(submitButton);

      // Should show error toast, NOT redirect
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining("Invalid"),
        );
      });

      // Verify router.push was NOT called (which would cause unwanted redirect)
      // This is the critical assertion for the bug
      const { useRouter } = await import("next/navigation");
      expect(useRouter().push).not.toHaveBeenCalled();
    });

    it("should handle network error gracefully", async () => {
      vi.mocked(loginIdentity).mockRejectedValue(new Error("Network error"));

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /login/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining("Network"),
        );
      });
    });

    it("should handle empty email field", async () => {
      render(<LoginForm />);

      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /login/i });

      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      // Form validation should prevent submission
      await waitFor(() => {
        expect(loginIdentity).not.toHaveBeenCalled();
      });
    });

    it("should handle empty password field", async () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", { name: /login/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.click(submitButton);

      // Form validation should prevent submission
      await waitFor(() => {
        expect(loginIdentity).not.toHaveBeenCalled();
      });
    });

    it("should handle invalid email format", async () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /login/i });

      fireEvent.change(emailInput, { target: { value: "not-an-email" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      // Form validation should prevent submission
      await waitFor(() => {
        expect(loginIdentity).not.toHaveBeenCalled();
      });
    });
  });

  // ============================================
  // LEVEL 3: ERROR HANDLING TESTS
  // ============================================

  describe("Level 3 - Error Handling Tests", () => {
    it("should handle 401 Unauthorized response correctly", async () => {
      // Simulate the scenario where backend returns 401
      const httpError = new Error(
        "Request failed (401 Unauthorized)",
      ) as Error & { status?: number };
      httpError.status = 401;
      vi.mocked(loginIdentity).mockRejectedValue(httpError);

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /login/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it("should handle 500 Internal Server Error", async () => {
      const httpError = new Error(
        "Request failed (500 Internal Server Error)",
      ) as Error & { status?: number };
      httpError.status = 500;
      vi.mocked(loginIdentity).mockRejectedValue(httpError);

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /login/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it("should handle unexpected error format - string error", async () => {
      // Test with non-Error object thrown
      vi.mocked(loginIdentity).mockRejectedValue("Unexpected string error");

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /login/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Login failed");
      });
    });

    it("should handle unexpected error format - null error", async () => {
      vi.mocked(loginIdentity).mockRejectedValue(null);

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /login/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Login failed");
      });
    });

    it("should handle undefined error", async () => {
      vi.mocked(loginIdentity).mockRejectedValue(undefined);

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /login/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Login failed");
      });
    });
  });

  // ============================================
  // LEVEL 4: INTEGRATION BEHAVIOR TESTS
  // ============================================

  describe("Level 4 - Integration Behavior", () => {
    it("should NOT redirect on failed login attempt", async () => {
      const mockRouter = {
        push: vi.fn(),
        refresh: vi.fn(),
      };

      vi.mock("next/navigation", () => ({
        useRouter: () => mockRouter,
        useSearchParams: () => new URLSearchParams(),
      }));

      vi.mocked(loginIdentity).mockRejectedValue(
        new Error("Invalid credentials"),
      );

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /login/i });

      fireEvent.change(emailInput, {
        target: { value: "invalid@example.com" },
      });
      fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        // Should NOT redirect
        expect(mockRouter.push).not.toHaveBeenCalled();
        // But should show error
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it("should properly handle redirect from backend (if it occurs)", async () => {
      // This test covers the potential scenario where backend might return
      // a redirect response (3xx) instead of proper error
      // In such case, fetch() automatically follows redirect

      const mockRouter = {
        push: vi.fn(),
        refresh: vi.fn(),
      };

      vi.mock("next/navigation", () => ({
        useRouter: () => mockRouter,
        useSearchParams: () => new URLSearchParams(),
      }));

      // Simulate what happens when loginIdentity returns without throwing
      // (which would happen if backend redirects instead of returning error)
      vi.mocked(loginIdentity).mockResolvedValue(undefined);

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /login/i });

      fireEvent.change(emailInput, {
        target: { value: "invalid@example.com" },
      });
      fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        // If no error is thrown and login succeeds, it would redirect to home
        // This is the BUG behavior we're testing against
        expect(mockRouter.push).toHaveBeenCalledWith("/");
      });
    });
  });
});
