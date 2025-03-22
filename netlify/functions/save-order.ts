import { Handler } from "@netlify/functions";
import { Client } from "@notionhq/client";
import { v2 as cloudinary } from "cloudinary";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
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

    if (!encodedGlbData || !email || !sessionId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Missing required fields",
          received: {
            hasEmail: !!email,
            hasGlbData: !!encodedGlbData,
            hasSessionId: !!sessionId,
          },
        }),
      };
    }

    // Upload to Cloudinary
    const uploadResponse = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          public_id: `orders/${sessionId}`,
          format: "glb",
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            resolve(result);
          }
        },
      );

      uploadStream.write(Buffer.from(encodedGlbData, "base64"));
      uploadStream.end();
    });

    const fileUrl = uploadResponse.secure_url;
    console.log("File uploaded successfully:", fileUrl);

    // Create Notion page
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
              name: `${sessionId}.glb`,
              type: "external",
              external: {
                url: fileUrl,
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
        fileUrl: fileUrl,
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
