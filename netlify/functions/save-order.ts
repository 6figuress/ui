import { Handler } from "@netlify/functions";
import { Client } from "@notionhq/client";
import { getStore } from "@netlify/blobs";
import { Buffer } from "buffer";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;
const SITE_ID = process.env.NETLIFY_SITE_ID;

// Create blob store with explicit configuration
const store = getStore({
  name: "duck-models",
  siteID: SITE_ID || "",
  token: process.env.NETLIFY_API_TOKEN || "",
});

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  try {
    const { email, encodedGlbData, sessionId } = JSON.parse(event.body || "{}");

    // Generate a unique filename
    const fileName = `${sessionId}.glb`;

    // Store the file
    const buffer = Buffer.from(encodedGlbData, "base64");
    await store.set(fileName, buffer, {
      type: "model/gltf-binary",
      metadata: {
        cacheControl: "public, max-age=31536000", // Cache for 1 year
      },
      access: "public", // Make the blob public
    });

    // Construct the public URL
    const blobUrl = `https://${SITE_ID}--duck-models.netlify.app/.netlify/blobs/${fileName}`;
    console.log("Generated blob URL:", blobUrl);

    await notion.pages.create({
      parent: { database_id: DATABASE_ID! },
      properties: {
        title: {
          title: [
            {
              text: {
                content: `Order ${sessionId}`,
              },
            },
          ],
        },
        "Model File": {
          files: [
            {
              name: fileName,
              type: "external",
              external: {
                url: blobUrl,
              },
            },
          ],
        },
        "Customer Email": {
          email: email,
        },
        "Session ID": {
          rich_text: [
            {
              type: "text",
              text: { content: sessionId },
            },
          ],
        },
        Status: {
          status: {
            name: "Not started",
          },
        },
        "Order Date": {
          date: {
            start: new Date().toISOString(),
          },
        },
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Order saved successfully",
        blobUrl: blobUrl,
      }),
    };
  } catch (error) {
    console.error("Detailed error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to save order",
        details: error.message,
      }),
    };
  }
};

export { handler };
