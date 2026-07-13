import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe('config', () => {
    const mockConfig = { apiUrl: 'https://api.example.com'};

    beforeEach(() => {
        vi.resetModules();
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('fetches and returns config on first call', async () => {
        (fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => mockConfig,
        });

        const { loadConfig } = await import('../../config');
        const result = await loadConfig();

        expect(result).toEqual(mockConfig);
        expect(fetch).toHaveBeenCalledWith('/config.json', { cache: 'no-store'});
        expect(fetch).toHaveBeenCalledTimes(1)
    })

    it('returns cached config on subsequent calls withiout refetching', async () => {
        (fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => mockConfig,
        });

        const { loadConfig} = await import('../../config');
        await loadConfig();
        const second = await loadConfig();
        
        expect(second).toEqual(mockConfig);
        expect(fetch).toHaveBeenCalledTimes(1);

    })

    it('throws when the response is not ok', async () => {
        (fetch as any).mockResolvedValueOnce({
            ok: false,
            json: async () => ({})
        });

        const { loadConfig } = await import('../../config');
        await expect(loadConfig()).rejects.toThrow('Failed to load runtime config');
    });

    it('getApiUrl returns apiUrl after config is loaded', async () => {
        (fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => mockConfig,
        });

        const { loadConfig, getApiUrl} = await import('../../config');
        await loadConfig();

        expect(getApiUrl()).toBe(mockConfig.apiUrl)
    });

    it('getApiUrl throws if config has not been loaded', async () => {
        const { getApiUrl } = await import('../../config');

        expect(() => getApiUrl()).toThrow('Config not loaded, call the loadConfig() first');
    });
});