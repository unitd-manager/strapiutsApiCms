const mysql = require("mysql2/promise");
const { v4: uuidv4 } = require("uuid");

async function migrateSubcategories() {
  const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "unitedweb"
  });

  try {
    console.log("🚀 Starting Subcategory Migration");

    const [oldRows] = await db.query("SELECT * FROM sub_category");

    if (!oldRows.length) {
      console.log("No records found in sub_category table.");
      return;
    }

    let migrated = 0;
    const now = new Date();

    for (const row of oldRows) {
      const documentId = uuidv4();
      // published_at = null → draft state (matches how other content types are migrated)
      const publishedAt = null;

      // Insert into Strapi subcategories table
      await db.query(
        `INSERT INTO subcategories
          (id, document_id, sub_category_id, sub_category_title, chi_title, sort_order,
           display_type, published, show_navigation_panel, external_link,
           sub_category_type, template, creation_date, modification_date,
           meta_title, meta_keyword, meta_description, internal_link,
           show_in_nav, seo_title, created_at, updated_at, published_at,
           created_by_id, updated_by_id, locale)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL)`,
        [
          row.sub_category_id,
          documentId,
          row.sub_category_id,
          row.sub_category_title || "",
          row.chi_title || null,
          row.sort_order || 0,
          row.display_type || null,
          row.published ? 1 : 0,
          row.show_navigation_panel ? 1 : 0,
          row.external_link || null,
          row.sub_category_type || null,
          row.template || null,
          row.creation_date || null,
          row.modification_date || null,
          row.meta_title || null,
          row.meta_keyword || null,
          row.meta_description || null,
          row.internal_link || null,
          row.show_in_nav ? 1 : 0,
          row.seo_title || null,
          now,
          now,
          publishedAt
        ]
      );

      // Link subcategory to its category in the link table
      if (row.category_id) {
        await db.query(
          `INSERT INTO subcategories_category_lnk (subcategory_id, category_id) VALUES (?, ?)`,
          [row.sub_category_id, row.category_id]
        );
      }

      console.log(`✅ Migrated: ${row.sub_category_title} (id: ${row.sub_category_id})`);
      migrated++;
    }

    console.log(`\n🎉 Subcategory Migration Completed. Total migrated: ${migrated}`);
  } catch (err) {
    console.error("❌ Migration Error:", err.message);
    console.error(err);
  } finally {
    await db.end();
  }
}

migrateSubcategories();
