// Simple setup file - no vitest imports to avoid runner issues
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

// Export a setup function that will be called by vitest
export function setup() {
  // This runs before each test
}

export function teardown() {
  cleanup();
}
