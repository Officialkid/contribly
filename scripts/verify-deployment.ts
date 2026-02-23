#!/usr/bin/env tsx
/**
 * Deployment Verification Script
 * 
 * Verifies that a deployed Contribly API instance is healthy and properly configured.
 * 
 * Usage:
 *   npx tsx scripts/verify-deployment.ts https://contribly-api.onrender.com
 *   npx tsx scripts/verify-deployment.ts http://localhost:3001
 */

interface TestResult {
  name: string;
  status: "PASS" | "FAIL" | "WARN";
  message: string;
  details?: any;
}

class DeploymentVerifier {
  private apiUrl: string;
  private results: TestResult[] = [];

  constructor(apiUrl: string) {
    // Remove trailing slash
    this.apiUrl = apiUrl.replace(/\/$/, "");
  }

  private addResult(name: string, status: "PASS" | "FAIL" | "WARN", message: string, details?: any) {
    this.results.push({ name, status, message, details });
  }

  private async testHealthCheck(): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 200) {
        const data = await response.json();
        
        if (data.status === "ok" && data.timestamp && data.version) {
          this.addResult(
            "Health Check",
            "PASS",
            `Health check returned 200 OK (version: ${data.version})`,
            data
          );
        } else {
          this.addResult(
            "Health Check",
            "WARN",
            "Health check returned 200 but response format is unexpected",
            data
          );
        }
      } else {
        this.addResult(
          "Health Check",
          "FAIL",
          `Health check returned ${response.status} instead of 200`,
          { status: response.status, statusText: response.statusText }
        );
      }
    } catch (error) {
      this.addResult(
        "Health Check",
        "FAIL",
        "Failed to connect to health check endpoint",
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  private async testCorsHeaders(): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/health`, {
        method: "OPTIONS",
        headers: {
          Origin: "https://example.com",
          "Access-Control-Request-Method": "GET",
          "Access-Control-Request-Headers": "Content-Type",
        },
      });

      const corsHeaders = {
        allowOrigin: response.headers.get("Access-Control-Allow-Origin"),
        allowMethods: response.headers.get("Access-Control-Allow-Methods"),
        allowHeaders: response.headers.get("Access-Control-Allow-Headers"),
        allowCredentials: response.headers.get("Access-Control-Allow-Credentials"),
      };

      if (corsHeaders.allowMethods && corsHeaders.allowHeaders) {
        const hasGetPost = corsHeaders.allowMethods.includes("GET") && 
                          corsHeaders.allowMethods.includes("POST");
        
        if (hasGetPost) {
          this.addResult(
            "CORS Headers",
            "PASS",
            "CORS headers are present and include required methods",
            corsHeaders
          );
        } else {
          this.addResult(
            "CORS Headers",
            "WARN",
            "CORS headers present but may not include all required methods",
            corsHeaders
          );
        }
      } else {
        this.addResult(
          "CORS Headers",
          "FAIL",
          "CORS headers are missing or incomplete",
          corsHeaders
        );
      }
    } catch (error) {
      this.addResult(
        "CORS Headers",
        "FAIL",
        "Failed to check CORS headers",
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  private async testLoginEndpoint(): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@example.com", password: "test" }),
      });

      // We expect 401 or 400 (bad credentials), but NOT 404
      if (response.status === 404) {
        this.addResult(
          "Login Endpoint",
          "FAIL",
          "Login endpoint returned 404 - endpoint not found or routes not loaded",
          { status: response.status }
        );
      } else if (response.status === 401 || response.status === 400) {
        this.addResult(
          "Login Endpoint",
          "PASS",
          `Login endpoint exists and responds (${response.status})`,
          { status: response.status }
        );
      } else {
        this.addResult(
          "Login Endpoint",
          "WARN",
          `Login endpoint returned unexpected status: ${response.status}`,
          { status: response.status }
        );
      }
    } catch (error) {
      this.addResult(
        "Login Endpoint",
        "FAIL",
        "Failed to reach login endpoint",
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  private async testRegistrationEndpoint(): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          password: "test123",
          name: "Test User",
          organizationName: "Test Org",
        }),
      });

      // We expect 400 (validation error) or 409 (conflict), but NOT 404
      if (response.status === 404) {
        this.addResult(
          "Registration Endpoint",
          "FAIL",
          "Registration endpoint returned 404 - endpoint not found or routes not loaded",
          { status: response.status }
        );
      } else if (response.status === 400 || response.status === 409 || response.status === 201) {
        this.addResult(
          "Registration Endpoint",
          "PASS",
          `Registration endpoint exists and responds (${response.status})`,
          { status: response.status }
        );
      } else {
        this.addResult(
          "Registration Endpoint",
          "WARN",
          `Registration endpoint returned unexpected status: ${response.status}`,
          { status: response.status }
        );
      }
    } catch (error) {
      this.addResult(
        "Registration Endpoint",
        "FAIL",
        "Failed to reach registration endpoint",
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  async runTests(): Promise<void> {
    console.log("🔍 Verifying Contribly API Deployment");
    console.log(`   Target: ${this.apiUrl}\n`);

    await this.testHealthCheck();
    await this.testCorsHeaders();
    await this.testLoginEndpoint();
    await this.testRegistrationEndpoint();
  }

  printResults(): void {
    console.log("\n" + "=".repeat(80));
    console.log("DEPLOYMENT VERIFICATION RESULTS");
    console.log("=".repeat(80) + "\n");

    const passCount = this.results.filter((r) => r.status === "PASS").length;
    const failCount = this.results.filter((r) => r.status === "FAIL").length;
    const warnCount = this.results.filter((r) => r.status === "WARN").length;

    this.results.forEach((result) => {
      const icon = result.status === "PASS" ? "✅" : result.status === "FAIL" ? "❌" : "⚠️ ";
      console.log(`${icon} ${result.status.padEnd(6)} | ${result.name}`);
      console.log(`   ${result.message}`);
      
      if (result.details && Object.keys(result.details).length > 0) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2).split('\n').join('\n   ')}`);
      }
      console.log();
    });

    console.log("=".repeat(80));
    console.log("SUMMARY");
    console.log("=".repeat(80));
    console.log(`✅ PASS: ${passCount}`);
    console.log(`❌ FAIL: ${failCount}`);
    console.log(`⚠️  WARN: ${warnCount}`);
    console.log();

    if (failCount === 0) {
      console.log("🎉 All critical checks passed! Deployment looks healthy.");
      process.exit(0);
    } else {
      console.log("⚠️  Some checks failed. Review the failures above.");
      process.exit(1);
    }
  }
}

// ============================================================================
// Main Execution
// ============================================================================
async function main() {
  const apiUrl = process.argv[2];

  if (!apiUrl) {
    console.error("❌ Error: API URL is required\n");
    console.log("Usage:");
    console.log("  npx tsx scripts/verify-deployment.ts <api-url>\n");
    console.log("Examples:");
    console.log("  npx tsx scripts/verify-deployment.ts https://contribly-api.onrender.com");
    console.log("  npx tsx scripts/verify-deployment.ts http://localhost:3001");
    process.exit(1);
  }

  // Validate URL format
  try {
    new URL(apiUrl);
  } catch (error) {
    console.error(`❌ Error: Invalid URL format: ${apiUrl}\n`);
    process.exit(1);
  }

  const verifier = new DeploymentVerifier(apiUrl);
  await verifier.runTests();
  verifier.printResults();
}

main().catch((error) => {
  console.error("❌ Unexpected error during verification:");
  console.error(error);
  process.exit(1);
});
