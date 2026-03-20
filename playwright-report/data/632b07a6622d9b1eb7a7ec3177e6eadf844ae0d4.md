# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications alt+T"
  - generic [ref=e4]:
    - link [ref=e6] [cursor=pointer]:
      - /url: /
    - generic [ref=e9]:
      - heading "Check your email" [level=3] [ref=e11]
      - generic [ref=e12]:
        - text: Please click the link sent to your email
        - link "your@email.com" [ref=e13] [cursor=pointer]:
          - /url: "#"
        - text: to verify your account.
      - link "Back to Home" [ref=e15] [cursor=pointer]:
        - /url: /
      - generic [ref=e16]:
        - generic [ref=e17]: Didn’t receive an email?
        - link "Resend" [ref=e18] [cursor=pointer]:
          - /url: /auth/signin
```