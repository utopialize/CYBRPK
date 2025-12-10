export class DataLoader {
    static async loadData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Could not load data from ${url}:`, error);
            return null;
        }
    }

    static async loadAll() {
        const [zones, pnjs, items, quests] = await Promise.all([
            this.loadData('./data/zones.json'),
            this.loadData('./data/pnj.json'),
            this.loadData('./data/items.json'),
            this.loadData('./data/quests.json')
        ]);
        return { zones, pnjs, items, quests };
    }
}
