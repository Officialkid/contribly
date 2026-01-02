# Google OAuth Setup Guide

This guide will walk you through setting up Google OAuth for the Contribly application.

## Prerequisites

- A Google account
- Access to the [Google Cloud Console](https://console.cloud.google.com/)

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click "New Project"
4. Enter a project name (e.g., "Contribly")
5. Click "Create"

## Step 2: Enable Google OAuth APIs

1. In the Google Cloud Console, make sure your new project is selected
2. Go to "APIs & Services" > "Library"
3. Search for "Google+ API" and enable it
4. Search for "Google Identity" and enable it

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" as the user type
3. Click "Create"
4. Fill in the required information:
   - **App name**: Contribly
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
5. Click "Save and Continue"
6. On the "Scopes" page, click "Add or Remove Scopes"
7. Add the following scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
8. Click "Update" and then "Save and Continue"
9. On the "Test users" page (for development), add your test email addresses
10. Click "Save and Continue"
11. Review and click "Back to Dashboard"

## Step 4: Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Enter a name (e.g., "Contribly Web Client")
5. Under "Authorized JavaScript origins", add:
   - `http://localhost:3001` (for development)
   - Your production API URL (e.g., `https://api.contribly.com`)
6. Under "Authorized redirect URIs", add:
   - `http://localhost:3001/api/auth/google/callback` (for development)
   - Your production callback URL (e.g., `https://api.contribly.com/api/auth/google/callback`)
7. Click "Create"
8. Copy the "Client ID" and "Client Secret" that are displayed

## Step 5: Update Environment Variables

1. Open `apps/api/.env.local`
2. Update the following variables with your credentials:
   ```env
   GOOGLE_CLIENT_ID=your_actual_client_id_here
   GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
   ```
3. Save the file

## Step 6: Test the Integration

1. Start the API server:
   ```bash
   cd apps/api
   npm run dev
   ```

2. Start the web app:
   ```bash
   cd apps/web
   npm run dev
   ```

3. Navigate to `http://localhost:3000/login` or `http://localhost:3000/register`
4. Click "Continue with Google"
5. You should be redirected to Google's consent screen
6. After authorizing, you'll be redirected back to the application

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Make sure the redirect URI in your Google Cloud Console matches exactly:
  - Development: `http://localhost:3001/api/auth/google/callback`
  - Production: `https://your-api-domain.com/api/auth/google/callback`

### Error: "access_denied"
- Check that you've added your email as a test user in the OAuth consent screen
- Make sure the OAuth consent screen is properly configured

### Error: "invalid_client"
- Verify that your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Make sure there are no extra spaces or quotes in your `.env.local` file

## Production Deployment

For production deployment, make sure to:

1. Update the "Authorized JavaScript origins" to include your production frontend URL
2. Update the "Authorized redirect URIs" to include your production API callback URL
3. Update your production environment variables with the same credentials
4. Consider moving from "Testing" to "Production" status in the OAuth consent screen (requires verification)

## Security Notes

- Never commit your `.env.local` file to version control
- Keep your `GOOGLE_CLIENT_SECRET` secure and never expose it in client-side code
- Regularly rotate your OAuth credentials if compromised
- Use different credentials for development and production environments
