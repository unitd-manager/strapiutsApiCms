// const axios = require("axios");

// const LOCAL = "http://localhost:1337";
// const CLOUD = "https://dynamic-desk-eee881ee33.strapiapp.com";
// const TOKEN = "124caf3b2ffc41d9e03fe2363b1e93d2e2e772a07ea9dc533ca391a12fff52b952b8b301fe54ee0b61b5559c34b307d264e285ece068366cbb53ee36c3b0a0862dc61aee73265da2999078247a6c4cc2caf05b3e97505cf9d23c7308257bfa737eee2887a25b8bec82d2f8bf15dbb4aeb871fc7bdb38ad229623bc2e7de9c0b3";

// const migrate = async () => {
//   try {
//     console.log("🚀 Fetching relation data from cloud...");

//     let createdSectionsCount = 0;
//     let createdCategoriesCount = 0;
//     let migratedCount = 0;
//     let linkedCount = 0;

//     // helper: retry requests on 5xx errors
//     const requestWithRetries = async (method, url, options = {}, retries = 5, delay = 2000) => {
//       for (let i = 0; i < retries; i++) {
//         try {
//           if (method === 'get') return await axios.get(url, options);
//           if (method === 'post') return await axios.post(url, options.data, { headers: options.headers });
//           if (method === 'put') return await axios.put(url, options.data, { headers: options.headers });
//           return await axios({ method, url, ...options });
//         } catch (err) {
//           const status = err.response?.status;
//           if (status && status < 500) throw err; // do not retry client errors
//           const isLast = i === retries - 1;
//           console.log(`Request to ${url} failed (attempt ${i + 1}/${retries})`, status || err.message);
//           if (isLast) throw err;
//           await new Promise((res) => setTimeout(res, delay));
//           delay *= 1.5;
//         }
//       }
//     };

//     // 🔹 FETCH CLOUD RELATIONS (use allSettled to surface detailed errors)
//     const relationRequests = [
//       requestWithRetries('get', `${CLOUD}/api/sections`, { headers: { Authorization: `Bearer ${TOKEN}` } }),
//       requestWithRetries('get', `${CLOUD}/api/categories`, { headers: { Authorization: `Bearer ${TOKEN}` } }),
//     ];

//     const settled = await Promise.allSettled(relationRequests);

//     // tolerate cloud fetch failures: we'll create missing relations from local data
//     if (settled[0].status === 'rejected') {
//       console.log('Warning: failed to fetch cloud sections, will create from local data if needed');
//     }
//     if (settled[1].status === 'rejected') {
//       console.log('Warning: failed to fetch cloud categories, will create from local data if needed');
//     }

//     const sectionRes = settled[0].status === 'fulfilled' ? settled[0].value : { data: { data: [] } };
//     const categoryRes = settled[1].status === 'fulfilled' ? settled[1].value : { data: { data: [] } };

//     // 🔹 CREATE MAPS
//     const normalize = (s) => (s || "").toString().trim().toLowerCase();
//     const sectionMap = {};
//     sectionRes.data.data.forEach((item) => {
//       // cloud sections use `section_title`
//       sectionMap[normalize(item.section_title || item.title || "")] = item.id;
//     });

//     const categoryMap = {};
//     categoryRes.data.data.forEach((item) => {
//       // cloud categories use `category_title`
//       categoryMap[normalize(item.category_title || item.title || "")] = item.id;
//     });

    

//     console.log("✅ Maps ready");

//       // 🔹 FETCH LOCAL RELATION DATA (to map local IDs -> names)
//       const [localSectionsRes, localCategoriesRes] = await Promise.all([
//         axios.get(`${LOCAL}/api/sections?pagination[pageSize]=1000`),
//         axios.get(`${LOCAL}/api/categories?pagination[pageSize]=1000`),
//       ]);

//       const localSectionMap = {};
//       localSectionsRes.data.data.forEach((s) => {
//         const id = s.id || s.attributes?.id;
//         const title = s.attributes?.section_title || s.attributes?.title || s.section_title || s.title || "";
//         if (id) localSectionMap[id] = normalize(title);
//       });

//       const localCategoryMap = {};
//       localCategoriesRes.data.data.forEach((c) => {
//         const id = c.id || c.attributes?.id;
//         const title = c.attributes?.category_title || c.attributes?.title || c.category_title || c.title || "";
//         if (id) localCategoryMap[id] = normalize(title);
//       });

//       console.log('✅ Local relation maps ready');
//       console.log('Local sections:', Object.keys(localSectionMap).length, 'sample names:', Object.values(localSectionMap).slice(0,6));
//       console.log('Local section ids sample:', Object.keys(localSectionMap).slice(0,12));
//       console.log('Cloud sections mapped:', Object.keys(sectionMap).length, 'sample keys:', Object.keys(sectionMap).slice(0,6));
//       console.log('Cloud section ids sample:', Object.values(sectionMap).slice(0,12));

//       // helper: create a relation on cloud if missing
//       const createCloudRelation = async (kind, name) => {
//         if (!name) return null;
//         const endpoint = `${CLOUD}/api/${kind}`;
//         try {
//           const body = kind === 'sections' ? { data: { section_title: name } } : kind === 'categories' ? { data: { category_title: name } } : { data: { title: name } };
//           const res = await requestWithRetries('post', endpoint, {
//             data: body,
//             headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
//           });
//             createdSectionsCount += kind === 'sections' && res.data?.data?.id ? 1 : 0;
//             createdCategoriesCount += kind === 'categories' && res.data?.data?.id ? 1 : 0;
//             return res.data?.data?.id || null;
//         } catch (err) {
//           console.log(`Failed creating cloud ${kind} '${name}':`, err.response?.status || err.message);
//           if (err.response?.data) console.log('body:', JSON.stringify(err.response.data).slice(0,200));
//           return null;
//         }
//       };

//       // Ensure cloud maps include all local relations (create when missing)
//       const ensureCloudRelationsFromLocal = async () => {
//         // sections
//         const localSectionNames = new Set(Object.values(localSectionMap).filter(Boolean));
//           for (const name of localSectionNames) {
//             if (!sectionMap[name]) {
//               // create using the original-cased name (attempt to preserve display)
//               const createdId = await createCloudRelation('sections', name);
//               if (createdId) sectionMap[name] = createdId;
//             }
//           }

//         // categories
//         const localCategoryNames = new Set(Object.values(localCategoryMap).filter(Boolean));
//         for (const name of localCategoryNames) {
//           if (!categoryMap[name]) {
//             const createdId = await createCloudRelation('categories', name);
//             if (createdId) categoryMap[name] = createdId;
//           }
//         }
//       };

//       // do NOT auto-create cloud relations here; we will only update existing content records
//       // 🔹 FETCH CLOUD CONTENTS MAP (by documentId and title) to support updates
//       const cloudContentsRes = await (async () => {
//         try {
//           return await requestWithRetries('get', `${CLOUD}/api/contents?pagination[pageSize]=1000`, { headers: { Authorization: `Bearer ${TOKEN}` } });
//         } catch (err) {
//           console.log('Warning: failed to fetch cloud contents list, new records will be created');
//           return { data: { data: [] } };
//         }
//       })();

//       const cloudByDocumentId = {};
//       const cloudByTitle = {};
//       const cloudExistingById = {};
//       cloudContentsRes.data.data.forEach((c) => {
//         const attrs = c.attributes || {};
//         if (attrs.documentId) cloudByDocumentId[attrs.documentId] = c.id;
//         if (attrs.title) cloudByTitle[normalize(attrs.title || '')] = c.id;
//         cloudExistingById[c.id] = attrs;
//       });
//     // 🔹 FETCH LOCAL DATA WITH RELATIONS
//     const res = await axios.get(
//       `${LOCAL}/api/contents?pagination[pageSize]=1000`
//     );

//     const contents = res.data.data;

//     console.log("📦 Total records:", contents.length);

//    for (const item of contents) {
//   const attr = item.attributes || item;

//   // compute normalized relation keys early so warnings can reference them
//   const rawSection = attr.section?.data?.attributes?.title || attr.section_title || (attr.section_id ? localSectionMap[attr.section_id] : null) || '';
//   const rawCategory = attr.category?.data?.attributes?.title || attr.category_title || (attr.category_id ? localCategoryMap[attr.category_id] : null) || '';

//   const sectionKey = normalize(rawSection);
//   const categoryKey = normalize(rawCategory);

//   const sectionId = sectionMap[sectionKey] || null;
//   const categoryId = categoryMap[categoryKey] || null;

//   const sectionName = rawSection || null;
//   const categoryName = rawCategory || null;

//   if (attr.section_id && !localSectionMap[attr.section_id]) {
//     console.log(`⚠ local section_id ${attr.section_id} present but not found in localSectionMap`);
//   }

//   // warn when local id exists but no cloud mapping
//   if (attr.section_id && !sectionId) {
//     console.log(`⚠ no cloud mapping for local section_id=${attr.section_id} name='${localSectionMap[attr.section_id]}' (key='${sectionKey}')`);
//   }
//   if (attr.category_id && !categoryId) {
//     console.log(`⚠ no cloud mapping for local category_id=${attr.category_id} name='${localCategoryMap[attr.category_id]}' (key='${categoryKey}')`);
//   }

//   console.log("----");
//   console.log("Title:", attr.title || attr.title);
//   console.log("Section:", sectionName, "→", sectionId);
//   console.log("Category:", categoryName, "→", categoryId);

//   const payload = {
//     data: {
//       title: attr.title || "",
//       description: attr.description || "",
//       description_short: attr.description_short || "",
//         content_type: attr.content_type || "",

//       // ✅ relations: set numeric foreign keys expected by this project's schema
//       // leave null here; we'll resolve to existing cloud values or mapped ids before updating
//       section_id: null,
//       category_id: null,

//       published: Boolean(attr.published),
//       latest: Boolean(attr.latest),
//       favourite: Boolean(attr.favourite),
//       member_only: Boolean(attr.member_only),

//       meta_title: attr.meta_title || "",
//       meta_description: attr.meta_description || "",
//       meta_keyword: attr.meta_keyword || "",

//       external_link: attr.external_link || "",
//       internal_link: attr.internal_link || "",
//     },
//   };

//   try {
//     // prefer update when an existing cloud record is found; do NOT create new records
//     const existingId = (attr.documentId && cloudByDocumentId[attr.documentId]) || cloudByTitle[normalize(attr.title || '')] || null;
//     if (!existingId) {
//       console.log(`⏭ Skipping '${attr.title}' — no matching cloud record (will NOT create)`);
//       continue;
//     }

//     // use mapped cloud IDs by title when available; otherwise keep existing cloud values
//     const existingAttrs = cloudExistingById[existingId] || {};
//     const resolvedSectionId = sectionMap[sectionKey] || existingAttrs.section_id || null;
//     const resolvedCategoryId = categoryMap[categoryKey] || existingAttrs.category_id || null;

//     payload.data.section_id = resolvedSectionId;
//     payload.data.category_id = resolvedCategoryId;

//     try {
//       await requestWithRetries('put', `${CLOUD}/api/contents/${existingId}`, {
//         data: payload,
//         headers: {
//           Authorization: `Bearer ${TOKEN}`,
//           "Content-Type": "application/json",
//         },
//       });
//       migratedCount++;
//       if (resolvedSectionId || resolvedCategoryId) linkedCount++;
//       console.log("🔁 Updated:", attr.title, "(id:", existingId, ")");
//     } catch (err) {
//       console.log(`❌ Update failed for id=${existingId} (${err.response?.status || err.message}); skipping creation`);
//       continue;
//     }
//   } catch (err) {
//     console.log("❌ ERROR:", attr.title);
//     console.log(err.response?.data || err.message);
//   }
// }

//     console.log("🎉 Migration completed");
//     console.log('Summary: migrated=', migratedCount, 'linked=', linkedCount, 'createdSections=', createdSectionsCount, 'createdCategories=', createdCategoriesCount);
//   } catch (err) {
//     console.log("❌ FAILED:", err.message);
//     if (err.response) {
//       console.log('status:', err.response.status);
//       console.log('body:', err.response.data);
//     }
//     console.log(err.stack);
//   }
// };

// migrate();


const axios = require("axios");

const LOCAL = "http://localhost:1337";
const CLOUD = "https://dynamic-desk-eee881ee33.strapiapp.com";
const TOKEN = "124caf3b2ffc41d9e03fe2363b1e93d2e2e772a07ea9dc533ca391a12fff52b952b8b301fe54ee0b61b5559c34b307d264e285ece068366cbb53ee36c3b0a0862dc61aee73265da2999078247a6c4cc2caf05b3e97505cf9d23c7308257bfa737eee2887a25b8bec82d2f8bf15dbb4aeb871fc7bdb38ad229623bc2e7de9c0b3";


const PAGE_SIZE = 100;

async function migrateContents() {
  try {
    console.log("🚀 Starting Content Migration");

    let page = 1;
    let migrated = 0;

    while (true) {

      const res = await axios.get(
        `${LOCAL}/api/contents?pagination[page]=${page}&pagination[pageSize]=${PAGE_SIZE}`
      );

      const contents = res.data.data;

      if (!contents.length) break;

      console.log(`📦 Processing page ${page}`);

      for (const item of contents) {

        const attr = item.attributes || item;

        const payload = {
          data: {

            section_id: attr.section_id || null,
            category_id: attr.category_id || null,
            sub_category_id: attr.sub_category_id || null,
            author_id: attr.author_id || null,

            title: attr.title || "",
            show_title: Boolean(attr.show_title),

            type: attr.type || "",

            description_short: attr.description_short || "",
            description: attr.description || "",

            sort_order: attr.sort_order || 0,

            published: Boolean(attr.published),
            member_only: Boolean(attr.member_only),
            latest: Boolean(attr.latest),
            favourite: Boolean(attr.favourite),

            content_date: attr.content_date || null,

            chi_title: attr.chi_title || "",
            chi_description: attr.chi_description || "",

            content_type: attr.content_type || "",

            external_link: attr.external_link || "",

            meta_title: attr.meta_title || "",
            meta_keyword: attr.meta_keyword || "",
            meta_description: attr.meta_description || "",

            flag: Boolean(attr.flag),

            internal_link: attr.internal_link || ""

          }
        };

        try {

          await axios.post(
            `${CLOUD}/api/contents`,
            payload,
            {
              headers: {
                Authorization: `Bearer ${TOKEN}`,
                "Content-Type": "application/json"
              }
            }
          );

          console.log("✅ Migrated:", attr.title);
          migrated++;

        } catch (err) {

          console.log("❌ Failed:", attr.title);
          console.log(err.response?.data || err.message);

        }

      }

      page++;

    }

    console.log("🎉 Content Migration Completed");
    console.log("Total Contents Migrated:", migrated);

  } catch (err) {

    console.log("❌ Migration Error:", err.message);

  }
}

migrateContents();