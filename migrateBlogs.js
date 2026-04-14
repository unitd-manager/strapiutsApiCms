const axios = require("axios");

const LOCAL = "http://localhost:1337";
const CLOUD = "https://dynamic-desk-eee881ee33.strapiapp.com";
const TOKEN = "124caf3b2ffc41d9e03fe2363b1e93d2e2e772a07ea9dc533ca391a12fff52b952b8b301fe54ee0b61b5559c34b307d264e285ece068366cbb53ee36c3b0a0862dc61aee73265da2999078247a6c4cc2caf05b3e97505cf9d23c7308257bfa737eee2887a25b8bec82d2f8bf15dbb4aeb871fc7bdb38ad229623bc2e7de9c0b3";


const PAGE_SIZE = 100;

async function request(method, url, data = null) {
  return axios({
    method,
    url,
    data,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
  });
}

async function migrateBlogs() {
  try {
    console.log("🚀 Starting Blog Migration");

    let page = 1;
    let migrated = 0;

    while (true) {
      const res = await axios.get(
        `${LOCAL}/api/blogs?pagination[page]=${page}&pagination[pageSize]=${PAGE_SIZE}`
      );

      const blogs = res.data.data;

      if (!blogs.length) break;

      console.log(`📦 Processing page ${page}`);

      for (const blog of blogs) {
        const attr = blog.attributes || blog;

        const payload = {
          data: {
            title: attr.title || "",
            description: attr.description || "",
            author: attr.author || "",
            date: attr.date || null,
            category_id: attr.category_id || null,

            creation_date: attr.creation_date || null,
            modification_date: attr.modification_date || null,

            created_by: attr.created_by || null,
            modified_by: attr.modified_by || null,

            flag: Boolean(attr.flag),

            meta_title: attr.meta_title || "",
            meta_description: attr.meta_description || "",
            meta_keyword: attr.meta_keyword || "",

            us_title: attr.us_title || "",
            us_description: attr.us_description || "",

            published: Boolean(attr.published)
          },
        };

        try {
          await request("POST", `${CLOUD}/api/blogs`, payload);

          console.log("✅ Migrated:", attr.title);
          migrated++;
        } catch (err) {
          console.log("❌ Failed:", attr.title);
          console.log(err.response?.data || err.message);
        }
      }

      page++;
    }

    console.log("🎉 Migration Completed");
    console.log("Total Blogs Migrated:", migrated);
  } catch (err) {
    console.log("❌ Migration Error:", err.message);
  }
}

migrateBlogs();