const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

async function registerImages() {

  const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "unitedweb"
  });

  const uploadDir = path.join(__dirname,"public/uploads");
  const files = fs.readdirSync(uploadDir);

  for (const file of files) {

    const ext = path.extname(file);
    const hash = file.replace(ext,"");

    await db.query(`
      INSERT INTO files
      (document_id,name,hash,ext,mime,size,url,provider,created_at,updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'local', NOW(), NOW())
    `,[
      crypto.randomUUID(),
      file,
      hash,
      ext,
      "image/jpeg",
      0,
      `/uploads/${file}`
    ]);

    console.log("Registered:",file);

  }

  console.log("All images registered");

}

registerImages();