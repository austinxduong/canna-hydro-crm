CREATE EXTENSION IF NOT EXISTS postgis;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE "Invites" (
  "id" integer PRIMARY KEY,
  "email" varchar,
  "token" varchar UNIQUE, 
  "status" varchar,
  "role" varchar,
  "invited_by" integer,
  "expires_at" timestamp
);

CREATE TABLE "auth_identities" (
  "id" integer PRIMARY KEY,
  "user_id" integer,
  "provider" varchar,
  "provider_user_id" varchar
);

CREATE TABLE "Users" (
  "id" integer PRIMARY KEY,
  "name" varchar,
  "email" varchar UNIQUE,
  "status" varchar,
  "role" varchar,
  "last_active" timestamp
);

CREATE TABLE "Business" (
  "id" integer PRIMARY KEY,
  "name" varchar,
  "address" varchar,
  "phone" varchar,
  "location" geography(Point,4326),
  "category" varchar,
  "license_status" varchar,
  "license_number" varchar,
  "stage" varchar,
  "assigned_rep" integer,
  "last_activity_at" timestamp
);

CREATE TABLE "activity_log" (
  "id" integer PRIMARY KEY,
  "user_id" integer,
  "business_id" integer,
  "activity_type" varchar,
  "note" text,
  "created_at" timestamp
);

CREATE TABLE "source_records" (
  "id" integer PRIMARY KEY,
  "business_id" integer,
  "source" varchar,
  "source_record_id" varchar,
  "raw_name" varchar,
  "raw_address" varchar,
  "pulled_at" timestamp
);

ALTER TABLE "Business" ADD FOREIGN KEY ("assigned_rep") REFERENCES "Users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "source_records" ADD FOREIGN KEY ("business_id") REFERENCES "Business" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "activity_log" ADD FOREIGN KEY ("business_id") REFERENCES "Business" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "activity_log" ADD FOREIGN KEY ("user_id") REFERENCES "Users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "Invites" ADD FOREIGN KEY ("invited_by") REFERENCES "Users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "auth_identities" ADD FOREIGN KEY ("user_id") REFERENCES "Users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX idx_business_location ON "Business" USING GIST (location);

CREATE INDEX idx_business_name_trgm ON "Business" USING GIN (name gin_trgm_ops);