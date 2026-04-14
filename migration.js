const mysql = require("mysql2/promise");

async function migrate() {

  const oldDb = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "unitedweb"
  });

  const newDb = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "unitedweb"
  });

  console.log("Connected to databases");

  await migrateSections(oldDb, newDb);
  await migrateCategories(oldDb, newDb);
  await migrateContents(oldDb, newDb);
  await migrateBlogs(oldDb, newDb);
  await migrateSettings(oldDb, newDb);
  await migrateEnquiries(oldDb, newDb);

  console.log("Migration completed");

}

/* ---------------- SECTIONS ---------------- */

async function migrateSections(oldDb, newDb) {

  const [rows] = await oldDb.query("SELECT * FROM section");

  for (const row of rows) {

    await newDb.query(`
      INSERT INTO sections
      (id, section_title, display_type, description, sort_order, published, creation_date, modification_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,[
      row.section_id,
      row.section_title,
      row.display_type,
      row.description,
      row.sort_order,
      row.published,
      row.creation_date,
      row.modification_date
    ]);

  }

  console.log("Sections migrated");

}

/* ---------------- CATEGORIES ---------------- */

async function migrateCategories(oldDb, newDb) {

  const [rows] = await oldDb.query("SELECT * FROM category");

  for (const row of rows) {

    await newDb.query(`
      INSERT INTO categories
      (id, section_id, category_title, description, sort_order, published, creation_date, modification_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,[
      row.category_id,
      row.section_id,
      row.category_title,
      row.description,
      row.sort_order,
      row.published,
      row.creation_date,
      row.modification_date
    ]);

  }

  console.log("Categories migrated");

}

/* ---------------- CONTENT ---------------- */

async function migrateContents(oldDb, newDb) {

  const [rows] = await oldDb.query("SELECT * FROM content");

  for (const row of rows) {

    await newDb.query(`
      INSERT INTO contents
      (id, section_id, category_id, title, description, sort_order, published, creation_date, modification_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,[
      row.content_id,
      row.section_id,
      row.category_id,
      row.title,
      row.description,
      row.sort_order,
      row.published,
      row.creation_date,
      row.modification_date
    ]);

  }

  console.log("Contents migrated");

}

/* ---------------- BLOG ---------------- */

async function migrateBlogs(oldDb, newDb) {

  const [rows] = await oldDb.query("SELECT * FROM blog");

  for (const row of rows) {

    await newDb.query(`
      INSERT INTO blogs
      (id, title, description, author, date, category_id, meta_title, meta_description, meta_keyword, published, creation_date, modification_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,[
      row.blog_id,
      row.title,
      row.description,
      row.author,
      row.date,
      row.category_id,
      row.meta_title,
      row.meta_description,
      row.meta_keyword,
      row.published,
      row.creation_date,
      row.modification_date
    ]);

  }

  console.log("Blogs migrated");

}

/* ---------------- SETTINGS ---------------- */

async function migrateSettings(oldDb, newDb) {

  const [rows] = await oldDb.query("SELECT * FROM setting");

  for (const row of rows) {

    await newDb.query(`
      INSERT INTO settings
      (id, key_text, value, description, group_name, creation_date, modification_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,[
      row.setting_id,
      row.key_text,
      row.value,
      row.description,
      row.group_name,
      row.creation_date,
      row.modification_date
    ]);

  }

  console.log("Settings migrated");

}

/* ---------------- ENQUIRIES ---------------- */

async function migrateEnquiries(oldDb, newDb) {

  const [rows] = await oldDb.query("SELECT * FROM enquiry");

  for (const row of rows) {

    await newDb.query(`
      INSERT INTO enquiries
      (id, name, email, subject, comments, creation_date, modification_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,[
      row.enquiry_id,
      row.name,
      row.email,
      row.subject,
      row.comments,
      row.creation_date,
      row.modification_date
    ]);

  }

  console.log("Enquiries migrated");

}

migrate();