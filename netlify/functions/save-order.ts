import { Handler } from "@netlify/functions";
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  try {
    const { email, duckUrl, sessionId } = JSON.parse(event.body || "{}");

    await notion.pages.create({
      parent: { database_id: DATABASE_ID! },
      properties: {
        "Model URI": {
          title: [
            {
              type: "text",
              text: { content: duckUrl },
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
      body: JSON.stringify({ message: "Order saved successfully" }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to save order" }),
    };
  }
};

export { handler };
