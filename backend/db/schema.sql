CREATE EXTENSION IF NOT EXISTS postgis;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE "Invites" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "email" varchar,
  "token" varchar UNIQUE, 
  "status" varchar,
  "role" varchar,
  "invited_by" integer,
  "expires_at" timestamptz
);

CREATE TABLE "auth_identities" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "user_id" integer,
  "provider" varchar,
  "provider_user_id" varchar
);

CREATE TABLE "Users" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "name" varchar,
  "email" varchar UNIQUE,
  "status" varchar,
  "role" varchar,
  "last_active" timestamptz
);

CREATE TABLE "Business" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "name" varchar,
  "address" varchar,
  "phone" varchar,
  "location" geography(Point,4326),
  "category" varchar,
  "license_status" varchar,
  "license_number" varchar,
  "stage" varchar,
  "assigned_rep" integer,
  "last_activity_at" timestamptz
);

CREATE TABLE "activity_log" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "user_id" integer,
  "business_id" integer,
  "activity_type" varchar,
  "note" text,
  "created_at" timestamptz
);

CREATE TABLE "source_records" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "business_id" integer,
  "source" varchar,
  "source_record_id" varchar,
  "raw_name" varchar,
  "raw_address" varchar,
  "pulled_at" timestamptz
);

ALTER TABLE "Business" ADD FOREIGN KEY ("assigned_rep") REFERENCES "Users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "source_records" ADD FOREIGN KEY ("business_id") REFERENCES "Business" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "activity_log" ADD FOREIGN KEY ("business_id") REFERENCES "Business" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "activity_log" ADD FOREIGN KEY ("user_id") REFERENCES "Users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "Invites" ADD FOREIGN KEY ("invited_by") REFERENCES "Users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "auth_identities" ADD FOREIGN KEY ("user_id") REFERENCES "Users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "Invites" ALTER COLUMN "expires_at" TYPE timestamptz USING "expires_at" AT TIME ZONE 'UTC';

ALTER TABLE "Users" ALTER COLUMN "last_active" TYPE timestamptz USING "last_active" AT TIME ZONE 'UTC';

ALTER TABLE "Business" ALTER COLUMN "last_activity_at" TYPE timestamptz USING "last_activity_at" AT TIME ZONE 'UTC';

ALTER TABLE "activity_log" ALTER COLUMN "created_at" TYPE timestamptz USING "created_at" AT TIME ZONE 'UTC';

ALTER TABLE "source_records" ALTER COLUMN "pulled_at" TYPE timestamptz USING "pulled_at" AT TIME ZONE 'UTC';

ALTER TABLE "Business" ALTER COLUMN stage SET DEFAULT 'New';

CREATE INDEX idx_business_location ON "Business" USING GIST (location);

CREATE INDEX idx_business_name_trgm ON "Business" USING GIN (name gin_trgm_ops);