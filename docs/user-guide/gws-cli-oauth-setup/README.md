# Google Workspace CLI Corporate OAuth Setup

## Goal

Provide a repeatable setup guide for team members who need to use the Google
Workspace CLI (`gws`) with approved corporate OAuth credentials.

This setup bypasses automated credential generation and points every local CLI
install at the same corporate `client_id` and `client_secret`.

## Prerequisites

- A Google Cloud project exists for the corporate OAuth application.
- The OAuth client is configured as a **Desktop app** client type.
- Team members who need access are added as **Test users** if the OAuth consent
  screen is still in Testing mode.
- The team has access to the approved corporate OAuth `client_id` and
  `client_secret`.

## Recommended Setup

Use a local credential file. This keeps the credentials in the location the CLI
expects and avoids requiring each shell session to export environment variables.

1. Obtain the `client_secret.json` file for the corporate OAuth client.
2. Create the local config directory:

   ```sh
   mkdir -p ~/.config/gws
   ```

3. Save the file at this exact path:

   ```text
   ~/.config/gws/client_secret.json
   ```

## Alternative Setup

If a file-based setup is not suitable, export the credentials through the shell
or a local `.env` file:

```sh
export GOOGLE_WORKSPACE_CLI_CLIENT_ID="your_corp_id_here"
export GOOGLE_WORKSPACE_CLI_CLIENT_SECRET="your_corp_secret_here"
```

Use this option only when the local environment reliably loads those variables
before `gws` commands run.

## Login Flow

After configuring credentials, run the login command with only the services the
team needs:

```sh
gws auth login --scopes drive,gmail,sheets
```

Keeping the requested scopes narrow is especially important while the corporate
OAuth app is unverified or in Testing mode.

The CLI will print a browser URL. Open that URL, choose the corporate Google
account, and approve the requested permissions.

If Google shows an unverified app warning, choose **Advanced**, then continue to
the app. This warning is expected when the corporate OAuth app has not completed
Google verification.

## Troubleshooting

### `redirect_uri_mismatch`

Confirm that the OAuth client in Google Cloud Console was created as a
**Desktop app** client. Web application clients use different redirect URI
rules and will not work for this CLI login flow.

### Access blocked

If the OAuth consent screen is in Testing mode, confirm that the user's email is
listed under **Test users** in the Google Cloud project.

### Wrong credentials are used

Check for conflicting environment variables first:

```sh
env | grep GOOGLE_WORKSPACE_CLI
```

If both environment variables and `~/.config/gws/client_secret.json` exist,
confirm which credential source the CLI version in use prefers. Standardize the
team on one method to avoid inconsistent setup.

## Operating Notes

- Do not commit `client_secret.json` to source control.
- Rotate and redistribute the corporate OAuth client secret according to the
  organization's credential management policy.
- Re-run `gws auth login` after credential rotation, scope changes, or OAuth
  consent screen changes.
