const axios = require("axios");

const LOCAL = "http://localhost:1337";
const CLOUD = "https://dynamic-desk-eee881ee33.strapiapp.com";
const TOKEN = "124caf3b2ffc41d9e03fe2363b1e93d2e2e772a07ea9dc533ca391a12fff52b952b8b301fe54ee0b61b5559c34b307d264e285ece068366cbb53ee36c3b0a0862dc61aee73265da2999078247a6c4cc2caf05b3e97505cf9d23c7308257bfa737eee2887a25b8bec82d2f8bf15dbb4aeb871fc7bdb38ad229623bc2e7de9c0b3";



const PAGE_SIZE = 100;

async function migrateSettings() {

  try {

    console.log("🚀 Starting Settings Migration");

    let page = 1;
    let migrated = 0;

    while (true) {

      const res = await axios.get(
        `${LOCAL}/api/settings?pagination[page]=${page}&pagination[pageSize]=${PAGE_SIZE}`
      );

      const settings = res.data.data;

      if (!settings.length) break;

      console.log(`📦 Processing page ${page}`);

      for (const setting of settings) {

        const attr = setting.attributes || setting;

        const payload = {
          data: {

            description: attr.description || "",

            key_text: attr.key_text || "",

            value: attr.value || "",

            group_name: attr.group_name || "",

            value_type: attr.value_type || "",

            show_to_user: Boolean(attr.show_to_user),

            chi_value: attr.chi_value || "",

            used_for_admin: Boolean(attr.used_for_admin),

            used_for_www: Boolean(attr.used_for_www)

          }
        };

        try {

          await axios.post(
            `${CLOUD}/api/settings`,
            payload,
            {
              headers: {
                Authorization: `Bearer ${TOKEN}`,
                "Content-Type": "application/json"
              }
            }
          );

          console.log("✅ Migrated:", attr.key_text);
          migrated++;

        } catch (err) {

          console.log("❌ Failed:", attr.key_text);
          console.log(err.response?.data || err.message);

        }

      }

      page++;

    }

    console.log("🎉 Settings Migration Completed");
    console.log("Total Settings Migrated:", migrated);

  } catch (err) {

    console.log("❌ Migration Error:", err.message);

  }

}

migrateSettings();