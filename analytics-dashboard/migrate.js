#!/usr/bin/env node
/**
 * One-off migration: copies documents out of the old, shared `analytics_events`
 * collection that match SIH Navigator's event schema (eventType + ps_id present)
 * into the new, namespaced `sih_nav_analytics_events` collection. Does NOT
 * touch/delete anything in the old collection — this is additive only, so it's
 * safe to re-run. Deleting the originals is a separate, explicit step.
 *
 * Usage: node analytics-dashboard/migrate.js [--delete]
 */

const { execSync } = require("node:child_process");

const PROJECT_ID = "sih-connect";
const OLD_COLLECTION = "analytics_events";
const NEW_COLLECTION = "sih_nav_analytics_events";
const PAGE_SIZE = 300;

const shouldDelete = process.argv.includes("--delete");

function getAccessToken() {
  try {
    return execSync("gcloud auth print-access-token", { encoding: "utf8" }).trim();
  } catch {
    console.error("Couldn't get a gcloud access token. Run `gcloud auth login` first.");
    process.exit(1);
  }
}

function encodeValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (typeof value === "boolean") return { booleanValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  if (typeof value === "object") {
    const fields = {};
    for (const [k, v] of Object.entries(value)) fields[k] = encodeValue(v);
    return { mapValue: { fields } };
  }
  return { nullValue: null };
}

function decodeValue(value) {
  if (value == null) return null;
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("timestampValue" in value) return new Date(value.timestampValue);
  if ("nullValue" in value) return null;
  if ("mapValue" in value) return decodeFields(value.mapValue.fields ?? {});
  if ("arrayValue" in value) return (value.arrayValue.values ?? []).map(decodeValue);
  return null;
}

function decodeFields(fields) {
  const out = {};
  for (const [key, value] of Object.entries(fields)) out[key] = decodeValue(value);
  return out;
}

async function fetchAll(token, collection) {
  const docs = [];
  let pageToken;
  do {
    const url = new URL(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}`
    );
    url.searchParams.set("pageSize", String(PAGE_SIZE));
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, "x-goog-user-project": PROJECT_ID },
    });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${await res.text()}`);
    const body = await res.json();
    for (const doc of body.documents ?? []) {
      const id = doc.name.split("/").pop();
      docs.push({ id, fields: decodeFields(doc.fields ?? {}) });
    }
    pageToken = body.nextPageToken;
  } while (pageToken);
  return docs;
}

// A document belongs to SIH Navigator if it has our distinctive shape:
// eventType (click/dialog_close) + ps_id. The other app uses `type` (not
// `eventType`) and viewerId/profileId, never ps_id.
function isOurEvent(fields) {
  return (
    typeof fields.eventType === "string" &&
    ["click", "dialog_close"].includes(fields.eventType) &&
    typeof fields.ps_id === "string" &&
    typeof fields.userId === "string"
  );
}

async function writeDoc(token, collection, id, fields) {
  const encodedFields = {};
  for (const [k, v] of Object.entries(fields)) encodedFields[k] = encodeValue(v);
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${id}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-goog-user-project": PROJECT_ID,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields: encodedFields }),
  });
  if (!res.ok) throw new Error(`Write failed for ${id}: ${res.status} ${await res.text()}`);
}

async function deleteDoc(token, collection, id) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${id}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}`, "x-goog-user-project": PROJECT_ID },
  });
  if (!res.ok) throw new Error(`Delete failed for ${id}: ${res.status} ${await res.text()}`);
}

async function main() {
  const token = getAccessToken();
  console.log(`Scanning ${OLD_COLLECTION} for SIH Navigator events...`);
  const allDocs = await fetchAll(token, OLD_COLLECTION);
  const ours = allDocs.filter((d) => isOurEvent(d.fields));
  console.log(
    `${allDocs.length} total documents in ${OLD_COLLECTION}, ${ours.length} match our schema.`
  );

  if (ours.length === 0) {
    console.log("Nothing to migrate.");
    return;
  }

  console.log(`Copying ${ours.length} documents to ${NEW_COLLECTION}...`);
  for (const doc of ours) {
    await writeDoc(token, NEW_COLLECTION, doc.id, doc.fields);
  }
  console.log("Copy complete.");

  if (shouldDelete) {
    console.log(`Deleting the ${ours.length} migrated documents from ${OLD_COLLECTION}...`);
    for (const doc of ours) {
      await deleteDoc(token, OLD_COLLECTION, doc.id);
    }
    console.log("Deleted originals from the old collection.");
  } else {
    console.log(
      `\nOriginals left in place in ${OLD_COLLECTION}. Re-run with --delete once you've ` +
        `verified the copies look right (e.g. via \`npm run analytics\`).`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
