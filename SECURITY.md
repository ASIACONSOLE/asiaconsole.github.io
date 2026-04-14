# Security Policy — AsiaConsole

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:
- **Email:** admin@asiaconsole.com
- **Do NOT** open a public GitHub issue for security vulnerabilities.

## Security Best Practices

### API Keys
- All API keys (Gemini, Groq, OpenRouter, Mistral) are stored in `localStorage` on the client side.
- The Firebase config object contains **public** identifiers only (not secrets). This is by design.
- Never commit `.env` files or `service-account.json` to the repository.

### Firebase
- Firestore Security Rules must be configured in the Firebase Console.
- The `service-account.json` file must NEVER be committed to Git (blocked by `.gitignore`).

### Authentication
- Admin passwords are stored locally in `localStorage` (hashed recommended for future).
- Google OAuth uses the standard GSI flow with a public Client ID.

## Supported Versions

| Version | Supported |
| ------- | --------- |
| Latest  | ✅         |
