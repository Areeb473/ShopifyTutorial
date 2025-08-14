const axios = require('axios');
require("dotenv").config();
// ------------------- CONFIG -------------------
// Shopify credentials
const SHOPIFY_STORE = process.env.SHOPIFY_STORE; // full Shopify store domain
const SHOPIFY_TOKEN = process.env.SHOPIFY_TOKEN;

// Kogan credentials
const KOGAN_SELLER_ID = process.env.KOGAN_SELLER_ID;
const KOGAN_SELLER_TOKEN = process.env.KOGAN_SELLER_TOKEN;

// Shopify API version
const SHOPIFY_API_VERSION = '2025-01';

// ------------------- FUNCTIONS -------------------

// 1️⃣ Fetch products from Shopify
async function getShopifyProducts() {
  try {
    const res = await axios.get(
      `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}/products.json`,
      {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );
    return res.data.products || [];
  } catch (error) {
    console.error('❌ Error fetching Shopify products:', error.response?.data || error.message);
    return [];
  }
}

// 2️⃣ Map Shopify products to Kogan format (required fields included)
function mapToKoganFormat(products) {
  return products.map(p => ({
    sku: p.variants[0].sku || `SKU-${p.id}`,
    name: p.title,
    description: p.body_html || '',
    price: parseFloat(p.variants[0].price),
    quantity: p.variants[0].inventory_quantity,
    brand: p.vendor || 'Generic',
    categories: ['Other'], // change this to actual Kogan category if you know it
    images: p.images.map(img => img.src)
  }));
}

// 3️⃣ Push products to Kogan
async function pushProductsToKogan(products) {
  for (const product of products) {
    try {
      console.log(`📤 Sending product to Kogan: ${product.name} (SKU: ${product.sku})`);
      const res = await axios.post(
        'https://nimda-marketplace.aws.kgn.io/api/marketplace/v2/products/import',
        { products: [product] }, // send one product at a time
        {
          headers: {
            'Content-Type': 'application/json',
            'SellerId': KOGAN_SELLER_ID,
            'SellerToken': KOGAN_SELLER_TOKEN
          }
        }
      );
      console.log(`✅ Import response:`, res.data);
    } catch (err) {
      console.error(`❌ Error sending ${product.name} to Kogan:`, err.response?.data || err.message);
    }
  }
}

// ------------------- MAIN -------------------
(async () => {
  console.log('📦 Fetching products from Shopify...');
  const shopifyProducts = await getShopifyProducts();
  console.log(`✅ Found ${shopifyProducts.length} products`);

  if (shopifyProducts.length === 0) {
    console.log('⚠️ No products found in Shopify to sync.');
    return;
  }

  const koganProducts = mapToKoganFormat(shopifyProducts);
  await pushProductsToKogan(koganProducts);

  console.log('🚀 Sync complete! Now check your Kogan seller account.');
})();
