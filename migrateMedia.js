// const fs = require("fs");
// const path = require("path");
// const FormData = require("form-data");
// const mysql = require("mysql2/promise");
// const axios = require("axios");

// const STRAPI_URL = "http://localhost:1337";
// const IMAGE_DIR = path.resolve("C:/Users/HP/Downloads/uploads(1)/uploads");

// const STRAPI_TOKEN = "c86caee39e587bf484af283ea89201fff1b0cfa2e30015a59f30cd5a4d0eaeac249f6132e1f922973a7bcbae825ac38723fe9b4b890f71199c9eb4cc3444540d045da05185d4a229ac64bc93e9e951a64197b6820d64d37f95022109ea1be763e50dbc6c138b7e7f24a484a12b23598be7c5cbf8a3c31d9e705e0a430e661a69";

// const MODULE_MAP = {
//   blog: "api::blog.blog",
//   content: "api::content.content",
//   category: "api::category.category",
//   section: "api::section.section"
// };

// (async () => {

//   console.log("IMAGE_DIR:", IMAGE_DIR);
//   console.log("DIR EXISTS:", fs.existsSync(IMAGE_DIR));

//   const db = await mysql.createConnection({
//     host: "localhost",
//     user: "root",
//     password: "",
//     database: "unitedweb"
//   });

//   const [media] = await db.execute(`
//     SELECT record_id, file_name, room_name
//     FROM media
//     WHERE file_name IS NOT NULL
//   `);

//   console.log("Media rows:", media.length);

//   const allFiles = fs.readdirSync(IMAGE_DIR);

//   for (const m of media) {

//     try {

//       const room = m.room_name.trim().toLowerCase();
//       const apiName = MODULE_MAP[room];

//       if (!apiName) {
//         console.log("⚠️ Skipping module:", m.room_name);
//         continue;
//       }

//       const filename = m.file_name.trim().replace(/\r|\n/g, "");

//       const matched = allFiles.find(f =>
//         f.toLowerCase() === filename.toLowerCase()
//       );

//       if (!matched) {
//         console.log("⚠️ Missing file:", filename);
//         continue;
//       }

//       const filePath = path.join(IMAGE_DIR, matched);

//       const form = new FormData();
//       form.append("files", fs.createReadStream(filePath));
//       form.append("ref", apiName);
//       form.append("refId", m.record_id);
//       form.append("field", "images");

//       await axios.post(`${STRAPI_URL}/api/upload`, form, {
//         headers: {
//           ...form.getHeaders(),
//           Authorization: `Bearer ${STRAPI_TOKEN}`
//         }
//       });

//       console.log(`✅ Uploaded ${filename} → ${room} ${m.record_id}`);

//     } catch (err) {

//       console.log("❌ Failed:", m.file_name);
//       console.log(err.response?.data || err.message);

//     }

//   }

//   console.log("🎉 Media migration completed");

// })();

const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const mysql = require("mysql2/promise");
const axios = require("axios");

const STRAPI_URL = "http://localhost:1337";
const IMAGE_DIR = path.resolve("C:/Users/HP/Downloads/uploads(1)/uploads");

const STRAPI_TOKEN = "c86caee39e587bf484af283ea89201fff1b0cfa2e30015a59f30cd5a4d0eaeac249f6132e1f922973a7bcbae825ac38723fe9b4b890f71199c9eb4cc3444540d045da05185d4a229ac64bc93e9e951a64197b6820d64d37f95022109ea1be763e50dbc6c138b7e7f24a484a12b23598be7c5cbf8a3c31d9e705e0a430e661a69";

(async () => {

  const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "unitedweb"
  });

  const [media] = await db.execute(`
    SELECT record_id, file_name
    FROM media
    WHERE room_name = 'banner'
      AND file_name IS NOT NULL
  `);

  console.log("Banner images found:", media.length);

  const allFiles = fs.readdirSync(IMAGE_DIR);

  for (const m of media) {

    try {

      const filename = m.file_name.trim().replace(/\r|\n/g, "");

      const matched = allFiles.find(f =>
        f.toLowerCase() === filename.toLowerCase()
      );

      if (!matched) {
        console.log("⚠️ File not found:", filename);
        continue;
      }

      const filePath = path.join(IMAGE_DIR, matched);

      /* ===============================
         1️⃣ CREATE BANNER RECORD
      =============================== */

      const bannerRes = await axios.post(
        `${STRAPI_URL}/api/banners`,
        {
          data: {
            banner_id: m.record_id
          }
        },
        {
          headers: {
            Authorization: `Bearer ${STRAPI_TOKEN}`
          }
        }
      );

      const bannerId = bannerRes.data.data.id;

      /* ===============================
         2️⃣ UPLOAD IMAGE
      =============================== */

      const form = new FormData();
      form.append("files", fs.createReadStream(filePath));
      form.append("ref", "api::banner.banner");
      form.append("refId", bannerId);
      form.append("field", "image");

      await axios.post(`${STRAPI_URL}/api/upload`, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${STRAPI_TOKEN}`
        }
      });

      console.log(`✅ Banner uploaded: ${filename}`);

    } catch (err) {

      console.log("❌ Failed:", m.file_name);
      console.log(err.response?.data || err.message);

    }

  }

  console.log("🎉 Banner migration completed");

})();