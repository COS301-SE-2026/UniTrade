import { setupServer } from 'msw/node'
import { listingLifecycleHandlers, browseAndReserveHandlers } from './handlers'
import { authHandlers } from './authHandlers'
import { sellerReservationHandlers } from './handlers'

export const server = setupServer(
  ...listingLifecycleHandlers,
  ...browseAndReserveHandlers,
  ...sellerReservationHandlers,
  ...authHandlers,
)