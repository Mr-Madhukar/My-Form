ALTER TABLE "forms" ADD COLUMN "google_sheets_connected" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "forms" ADD COLUMN "google_sheets_spreadsheet_id" text;--> statement-breakpoint
ALTER TABLE "forms" ADD COLUMN "google_sheets_spreadsheet_url" text;