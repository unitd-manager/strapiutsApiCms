const mysql = require("mysql2/promise");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

const API = "https://tidy-light-2ab5c4f13a.strapiapp.com/api/blogs";
const UPLOAD_API = "https://tidy-light-2ab5c4f13a.strapiapp.com/api/upload";

const TOKEN = "66d104a3ebfce41a87a20728d4493dd39c8e47b569eff0bb2f202f47f3cf0833470e6ae96cf25d13327c284cc0002d7b460e7ee3d36570a6157ccb81e2dd9c9db20749b6b20ecf8e5743e7f71b6b1a82d83b5b8fc67e404be2e4578c381c05fafe9980297511ecc6886123dda9c22047ac24c64f879d6aadf0d971231983769b";


const IMAGE_DIR = "C:/Users/HP/Downloads/uploads(1)/uploads";

function safeDate(date) {
  if (!date) return null;

  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return null;
  }

  return d.toISOString();
}

function safeOnlyDate(date) {
  if (!date) return null;

  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return null;
  }

  return d.toISOString().split("T")[0];
}

(async () => {

  const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "unitedweb"
  });

  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json"
  };

  console.log("Fetching blog records...");

  const [blogs] = await db.execute("SELECT * FROM blog");

  for (const row of blogs) {

    try {

     const data = {
  title: row.title || "",
  description: row.description || "",
  author: row.author || "",

  date: safeOnlyDate(row.date),

  category_id: row.category_id || 0,

  flag: row.flag ? true : false,

  meta_title: row.meta_title || "",
  meta_description: row.meta_description || "",
  meta_keyword: row.meta_keyword || "",

  us_title: row.us_title || "",
  us_description: row.us_description || "",

  published: row.published ? true : false
};

     console.log("Processing blog:", row.id, row.title);

      const res = await axios.post(
        API,
        { data },
        { headers }
      );

      const blogId = res.data.data.id;

      console.log("Inserted blog:", blogId);

      // Upload images if exists
      if (row.images) {

        const images = row.images.split(",");

        for (const img of images) {

          const filePath = path.join(IMAGE_DIR, img.trim());

          if (!fs.existsSync(filePath)) {
            console.log("Image not found:", img);
            continue;
          }

          const form = new FormData();

          form.append("files", fs.createReadStream(filePath));
          form.append("ref", "api::blog.blog");
          form.append("refId", blogId);
          form.append("field", "images");

          await axios.post(
            UPLOAD_API,
            form,
            {
              headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${TOKEN}`
              }
            }
          );

          console.log("Uploaded image:", img);

        }

      }

    } catch (err) {

      console.log("Error inserting blog:", row.id);
      console.log(err.response?.data || err.message);

    }

  }

  console.log("🎉 BLOG MIGRATION COMPLETED");

})();