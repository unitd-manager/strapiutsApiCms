const axios = require("axios");

const LOCAL = "http://localhost:1337";
const CLOUD = "https://dynamic-desk-eee881ee33.strapiapp.com";
const TOKEN = "124caf3b2ffc41d9e03fe2363b1e93d2e2e772a07ea9dc533ca391a12fff52b952b8b301fe54ee0b61b5559c34b307d264e285ece068366cbb53ee36c3b0a0862dc61aee73265da2999078247a6c4cc2caf05b3e97505cf9d23c7308257bfa737eee2887a25b8bec82d2f8bf15dbb4aeb871fc7bdb38ad229623bc2e7de9c0b3";


const PAGE_SIZE = 100;

async function migrateSections() {
  try {
    console.log("🚀 Starting Section Migration");

    let page = 1;
    let migrated = 0;

    while (true) {

      const res = await axios.get(
        `${LOCAL}/api/sections?pagination[page]=${page}&pagination[pageSize]=${PAGE_SIZE}`
      );

      const sections = res.data.data;

      if (!sections.length) break;

      console.log(`📦 Processing page ${page}`);

      for (const section of sections) {

        const attr = section.attributes || section;

        const payload = {
          data: {

            section_title: attr.section_title || "",
            display_type: attr.display_type || "",

            description: attr.description || "",

            sort_order: attr.sort_order || 0,

            published: Boolean(attr.published),

            external_link: attr.external_link || "",

            chi_title: attr.chi_title || "",
            chi_description: attr.chi_description || "",

            button_position: attr.button_position || "",

            template: attr.template || "",

            section_type: attr.section_type || "",

            meta_title: attr.meta_title || "",
            meta_keyword: attr.meta_keyword || "",
            meta_description: attr.meta_description || "",

            access_to: attr.access_to || "",

            top_section_id: attr.top_section_id || null,

            seo_title: attr.seo_title || "",

            internal_link: attr.internal_link || "",

            show_in_nav: Boolean(attr.show_in_nav),

            groups: attr.groups || "",

            routes: attr.routes || ""

          }
        };

        try {

          await axios.post(
            `${CLOUD}/api/sections`,
            payload,
            {
              headers: {
                Authorization: `Bearer ${TOKEN}`,
                "Content-Type": "application/json"
              }
            }
          );

          console.log("✅ Migrated:", attr.section_title);
          migrated++;

        } catch (err) {

          console.log("❌ Failed:", attr.section_title);
          console.log(err.response?.data || err.message);

        }

      }

      page++;

    }

    console.log("🎉 Section Migration Completed");
    console.log("Total Sections Migrated:", migrated);

  } catch (err) {

    console.log("❌ Migration Error:", err.message);

  }
}

migrateSections();