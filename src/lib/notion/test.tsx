import { getDatabase } from "lib/notion";

const pageId = "8a2857035181491fa7b3a32039414d64";

describe("Notion", () => {
	test(`getDatabase success ${pageId}`, async () => {
		const page = await getDatabase(pageId);
	});
});
