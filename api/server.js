const axios = require("axios");

const KOGAN_SELLER_ID = process.env.KOGAN_SELLER_ID;
const KOGAN_SELLER_TOKEN = process.env.KOGAN_SELLER_TOKEN;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const product = req.body;
    console.log("📦 Shopify sent product data:", product);

    const koganProduct = {
      sku: product.variants[0].sku || `SKU-${product.id}`,
      name: product.title,
      description: product.body_html || "",
      price: parseFloat(product.variants[0].price),
      quantity: product.variants[0].inventory_quantity,
      brand: product.vendor || "Generic",
      categories: ["Other"],
      images: product.images.map((img) => img.src),
    };

    const response = await axios.post(
      "https://nimda-marketplace.aws.kgn.io/api/marketplace/v2/products/import",
      { products: [koganProduct] },
      {
        headers: {
          "Content-Type": "application/json",
          SellerId: KOGAN_SELLER_ID,
          SellerToken: KOGAN_SELLER_TOKEN,
        },
      }
    );

    console.log("✅ Product sent to Kogan:", response.data);
    return res.status(200).send("OK");
  } catch (err) {
    console.error(
      "❌ Error sending to Kogan:",
      err.response?.data || err.message
    );
    return res.status(500).send("Error");
  }
};
