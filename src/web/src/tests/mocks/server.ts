import { setupServer } from 'msw/node'
import { listingLifecycleHandlers, browseAndReserveHandlers } from './handlers'
import { authHandlers } from './authHandlers'

export const server = setupServer(
  ...listingLifecycleHandlers,
  ...browseAndReserveHandlers,
  ...authHandlers,
)