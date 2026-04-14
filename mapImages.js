const mysql = require("mysql2/promise");

async function mapImages() {

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

  const [rows] = await oldDb.query("SELECT file_name, room_name, record_id FROM media");

  for (const row of rows) {

    const [files] = await newDb.query(
      "SELECT id FROM files WHERE name = ?",
      [row.file_name]
    );

    if(files.length === 0) continue;

    const fileId = files[0].id;

    let relatedType = "";

    if(row.room_name === "blog")
      relatedType = "api::blog.blog";

    if(row.room_name === "category")
      relatedType = "api::category.category";

    if(row.room_name === "content")
      relatedType = "api::content.content";

    if(!relatedType) continue;

    await newDb.query(`
      INSERT INTO files_related_mph
      (file_id, related_id, related_type, field)
      VALUES (?, ?, ?, ?)
    `,[
      fileId,
      row.record_id,
      relatedType,
      "image"
    ]);

    console.log(`Mapped ${row.file_name} → ${row.room_name} ${row.record_id}`);

  }

  console.log("Image mapping completed");

}

mapImages();