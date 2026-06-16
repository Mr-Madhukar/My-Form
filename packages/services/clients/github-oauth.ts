/**
 * GitHub OAuth Client Configuration
 *
 * Fill in your GitHub OAuth credentials below:
 * 1. Go to https://github.com/settings/developers
 * 2. Create a new OAuth App
 * 3. Set the callback URL to: YOUR_API_URL/auth/github/callback
 * 4. Copy the Client ID and Client Secret here
 */

export const GITHUB_OAUTH_CONFIG = {
  clientId: process.env.GITHUB_OAUTH_CLIENT_ID ?? "",
  clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET ?? "",
  callbackUrl: process.env.GITHUB_OAUTH_CALLBACK_URL ?? "",
  scopes: ["user:email", "read:user"],
};

/**
 * Generates the GitHub OAuth authorization URL.
 */
export function getGitHubAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: GITHUB_OAUTH_CONFIG.clientId,
    redirect_uri: GITHUB_OAUTH_CONFIG.callbackUrl,
    scope: GITHUB_OAUTH_CONFIG.scopes.join(" "),
    state,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * Exchanges an authorization code for an access token.
 */
export async function exchangeGitHubCode(code: string): Promise<string> {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: GITHUB_OAUTH_CONFIG.clientId,
      client_secret: GITHUB_OAUTH_CONFIG.clientSecret,
      code,
    }),
  });

  const data = (await response.json()) as { access_token?: string; error?: string };
  if (data.error || !data.access_token) {
    throw new Error(`GITHUB_OAUTH_ERROR: ${data.error ?? "No access token received"}`);
  }
  return data.access_token;
}

/**
 * Fetches the authenticated user's GitHub profile.
 */
export async function getGitHubUser(accessToken: string): Promise<{
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}> {
  const response = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return (await response.json()) as {
    id: number;
    login: string;
    name: string | null;
    email: string | null;
    avatar_url: string;
  };
}

/**
 * Fetches the user's verified email addresses from GitHub.
 */
export async function getGitHubEmails(accessToken: string): Promise<string | null> {
  const response = await fetch("https://api.github.com/user/emails", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const emails = (await response.json()) as { email: string; primary: boolean; verified: boolean }[];
  const primary = emails.find((e) => e.primary && e.verified);
  return primary?.email ?? emails.find((e) => e.verified)?.email ?? null;
}
