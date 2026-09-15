import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe('config', () => {
    const mockConfig = { apiUrl: 'https://api.example.com'};
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.resetModules();
        fetchMock = vi.fn()
        globalThis.fetch = fetchMock as unknown as typeof fetch;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('fetches and returns config on first call', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => mockConfig,
        });

        const { loadConfig } = await import('../../config');
        const result = await loadConfig();

        expect(result).toEqual(mockConfig);
        expect(fetchMock).toHaveBeenCalledWith('/config.json', { cache: 'no-store'});
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('returns cached config on subsequent calls withiout refetching', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => mockConfig,
        });

        const { loadConfig} = await import('../../config');
        await loadConfig();
        const second = await loadConfig();
        
        expect(second).toEqual(mockConfig);
        expect(fetchMock).toHaveBeenCalledTimes(1);

    })

    it('throws when the response is not ok', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: false,
            json: async () => ({})
        });

        const { loadConfig } = await import('../../config');
        await expect(loadConfig()).rejects.toThrow('Failed to load runtime config');
    });

    /*it('getApiUrl returns apiUrl after config is loaded', async () => {
       fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => mockConfig,
        });

        const { loadConfig, getApiUrl} = await import('../../config');
        await loadConfig();

        expect(getApiUrl()).toBe(`${mockConfig.apiUrl}/api`)
    });*/

    it('getApiUrl throws if config has not been loaded', async () => {
        const { getApiUrl } = await import('../../config');

        expect(() => getApiUrl()).toThrow('Config not loaded, call the loadConfig() first');
    });
});