# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> Public Page /auth/reset-password/changed loads without WSoD
- Location: tests/smoke.spec.ts:91:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.card, form, h1, h2').first()
Expected: visible
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('.card, form, h1, h2').first()

```

```yaml
- region "Notifications alt+T"
- heading "Your password is changed" [level=3]
- text: Your password has been successfully updated. Your account's security is our priority.
- link "Sign in":
  - /url: /auth/classic/signin
```

```
Error: write EPIPE
```