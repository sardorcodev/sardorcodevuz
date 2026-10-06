import { defineConfig } from "@playwright/test";
const port = Number(process.env.PORTFOLIO_TEST_PORT || 3102);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error("Invalid PORTFOLIO_TEST_PORT");
const origin = "http://127.0.0.1:" + port;
export default defineConfig({
  testDir: "./tests",
  testIgnore: "**/unit/**",
  fullyParallel: true,
  workers: process.env.CI ? 2 : 2,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: origin,
    viewport: { width: 390, height: 844 },
    browserName: "chromium",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : undefined,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port " + port,
    url: origin + "/en",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
