import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import type React from "react";

export function createTestQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: false},
        },
    })
}

export function renderWithProviders(
    routePath: string,
    element: React.ReactElement,
    { route = '/', queryClient = createTestQueryClient() } = {}
) {
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={[route]}>
                <Routes>
                    <Route path={routePath} element={element} />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>
    )
}