import sqlite3 from "sqlite3";
import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

sqlite3.verbose();
const __filename = fileURLToPath(import.meta.url);
const __dirname = __filename.substring(0, __filename.lastIndexOf("/"));
const DB_FILE = join(__dirname, "data.sqlite");

export const db = new sqlite3.Database(DB_FILE);

// Run schema on start
const schema = readFileSync(join(__dirname, "schema.sql"), "utf8");
db.exec(schema);
