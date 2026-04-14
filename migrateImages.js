const mysql = require("mysql2/promise");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

// const API = "https://tidy-light-2ab5c4f13a.strapiapp.com/api";
// const TOKEN = "66d104a3ebfce41a87a20728d4493dd39c8e47b569eff0bb2f202f47f3cf0833470e6ae96cf25d13327c284cc0002d7b460e7ee3d36570a6157ccb81e2dd9c9db20749b6b20ecf8e5743e7f71b6b1a82d83b5b8fc67e404be2e4578c381c05fafe9980297511ecc6886123dda9c22047ac24c64f879d6aadf0d971231983769b";

const API = "https://dynamic-desk-eee881ee33.strapiapp.com/api";
const TOKEN = "124caf3b2ffc41d9e03fe2363b1e93d2e2e772a07ea9dc533ca391a12fff52b952b8b301fe54ee0b61b5559c34b307d264e285ece068366cbb53ee36c3b0a0862dc61aee73265da2999078247a6c4cc2caf05b3e97505cf9d23c7308257bfa737eee2887a25b8bec82d2f8bf15dbb4aeb871fc7bdb38ad229623bc2e7de9c0b3";


const IMAGE_DIR = "C:/Users/HP/Downloads/uploads(1)/uploads";

const headers = {
  Authorization: `Bearer ${TOKEN}`
};

const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function retryRequest(fn, retries = 5) {
  try {
    return await fn();
  } catch (err) {

    if (err.response && err.response.status === 503 && retries > 0) {
      console.log("⚠️ Strapi sleeping... retrying");
      await delay(5000);
      return retryRequest(fn, retries - 1);
    }

    throw err;
  }
}

async function getAllBlogs() {

  let page = 1;
  let blogs = [];

  while (true) {

    const res = await retryRequest(() =>
      axios.get(
        `${API}/blogs?pagination[page]=${page}&pagination[pageSize]=100`,
        { headers }
      )
    );

    const data = res.data.data || [];

    blogs.push(...data);

    const pagination = res.data.meta.pagination;

    if (page >= pagination.pageCount) break;

    page++;

  }

  return blogs;

}

(async () => {

  const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "unitedweb"
  });

  console.log("Loading blogs from Strapi...");

  const strapiBlogs = await getAllBlogs();

  const blogMap = {};

  strapiBlogs.forEach(b => {

    if (!b.title) return;

    blogMap[b.title.trim()] = b.id;

  });

  console.log("Loading local blogs...");

  const [localBlogs] = await db.execute(`
      SELECT blog_id,title FROM blog
  `);

  const localBlogMap = {};

  localBlogs.forEach(b => {

    localBlogMap[b.blog_id] = b.title;

  });

  console.log("Loading media table...");

  const [mediaRows] = await db.execute(`
      SELECT record_id,file_name
      FROM media
      WHERE room_name='blog'
  `);

  for (const row of mediaRows) {

    try {

      const title = localBlogMap[row.record_id];

      if (!title) {

        console.log("❌ Blog not found for record:", row.record_id);

        continue;

      }

      const blogId = blogMap[title.trim()];

      if (!blogId) {

        console.log("❌ Blog missing in Strapi:", title);

        continue;

      }

      const filePath = path.join(IMAGE_DIR, row.file_name);

      if (!fs.existsSync(filePath)) {

        console.log("⚠️ Missing image:", row.file_name);

        continue;

      }

      const form = new FormData();

      form.append("files", fs.createReadStream(filePath));
      form.append("ref", "api::blog.blog");
      form.append("refId", blogId);
      form.append("field", "images");

      await retryRequest(() =>
        axios.post(`${API}/upload`, form, {
          headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${TOKEN}`
          }
        })
      );

      console.log("✅ Uploaded:", row.file_name, "→ Blog", blogId);

      await delay(300);

    } catch (err) {

      console.log("❌ Upload failed:", row.file_name);
      console.log(err.response?.data || err.message);

    }

  }

  console.log("🎉 Blog image migration completed");

})();