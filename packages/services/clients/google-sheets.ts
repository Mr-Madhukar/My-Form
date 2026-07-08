import { JWT } from "google-auth-library";
import { env } from "../env";

let authClient: JWT | null = null;

if (env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
  authClient = new JWT({
    email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

/**
 * Appends a row of values to the specified Google Sheet.
 * Range A1 is used as target; Google Sheets automatically detects the end of the sheet and appends.
 */
export async function appendRowToSheet(
  spreadsheetId: string,
  rowValues: string[],
): Promise<void> {
  if (!authClient) {
    console.warn(
      "[Google Sheets Sync] Google Service Account credentials are not configured in environment variables."
    );
    return;
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED`;

  try {
    const response = await authClient.request({
      url,
      method: "POST",
      data: {
        values: [rowValues],
      },
    });

    if (response.status !== 200) {
      throw new Error(
        `Google Sheets API responded with status ${response.status}: ${JSON.stringify(
          response.data
        )}`
      );
    }
  } catch (err) {
    console.error("[Google Sheets Sync] Error appending row to Google Sheet:", err);
    throw err;
  }
}
