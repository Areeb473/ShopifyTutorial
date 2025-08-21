// --- START OF FILE syncShopifyToKogan.js ---

const axios = require("axios");
require("dotenv").config();

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_TOKEN = process.env.SHOPIFY_TOKEN;

const KOGAN_SELLER_ID = process.env.KOGAN_SELLER_ID;
const KOGAN_SELLER_TOKEN = process.env.KOGAN_SELLER_TOKEN;

const SHOPIFY_API_URL = `https://${SHOPIFY_STORE}/admin/api/2023-10/products.json`;
// --- FIX 1: Using the correct, original endpoint ---
const KOGAN_API_URL = "https://nimda-marketplace.aws.kgn.io/api/marketplace/v2/products";

async function getShopifyProducts() {
  try {
    const response = await axios.get(SHOPIFY_API_URL, {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_TOKEN,
        "Content-Type": "application/json"
      }
    });
    return response.data.products;
  } catch (err) {
    console.error("❌ Error fetching Shopify products:", err.response?.data || err.message);
    return [];
  }
}

async function sendToKogan(product) {
  try {
    // --- FIX 2: This endpoint expects a direct array of products ---
    const payload = [
      {
        sku: product.variants[0].sku || `shopify-${product.id}`,
        name: product.title,
        description: product.body_html || "",
        price: product.variants[0].price,
        quantity: product.variants[0].inventory_quantity || 0,
        brand: product.vendor || "Generic",
        
        // --- FIX 3: Using a valid Kogan category ---
        category: "Home & Garden > Miscellaneous", // For this endpoint, Kogan often prefers a string path

        images: product.images?.map((img) => img.src) || [],
      }
    ];

    const response = await axios.post(KOGAN_API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        // --- FIX 4: Using the correct authentication headers ---
        "SellerId": KOGAN_SELLER_ID,
        "SellerToken": KOGAN_SELLER_TOKEN
      }
    });

    // A successful response from this endpoint should have a non-zero count
    if (response.data?.body?.count > 0) {
        console.log(`✅ Successfully created/updated '${product.title}' on Kogan:`, response.data);
    } else {
        console.warn(`⚠️ Product '${product.title}' was sent, but Kogan reported 0 items updated. It might already exist or there was a silent issue.`, response.data);
    }

  } catch (err) {
    console.error(
      `❌ Error sending '${product.title}' to Kogan:`,
      // This will now show a cleaner error instead of the full HTML page
      err.response?.data || err.message
    );
  }
}

(async () => {
  if (!KOGAN_SELLER_ID || !KOGAN_SELLER_TOKEN) {
    console.error("❌ Kogan credentials not found. Please check your .env file.");
    return;
  }

  const products = await getShopifyProducts();
  if (products.length === 0) {
      console.log("ℹ️ No products found in Shopify or failed to fetch them.");
      return;
  }
  
  console.log(`ℹ️ Found ${products.length} products. Starting sync to Kogan...`);
  for (let product of products) {
    await new Promise(resolve => setTimeout(resolve, 250)); // Slightly longer delay just in case
    await sendToKogan(product);
  }
  console.log("✨ Sync complete! Please check your Kogan Seller Portal now.");
})();