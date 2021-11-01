const { Client } = require("@notionhq/client");
import { NOTION_TOKEN } from "helpers/config";
import type { QueryDatabaseResponse } from "lib/notion/types";

const notion = new Client({
	auth: NOTION_TOKEN,
});

export const getPage = async (pageId: string) => {
	const record = await notion.pages.retrieve({ page_id: pageId });
	return record;
};

export const getDatabase = async (
	databaseId: string,
): Promise<QueryDatabaseResponse> => {
	const record = await notion.databases.query({ database_id: databaseId });
	return record;
};
