import { setupServer } from 'msw/node'
import { listingLifecycleHandlers, browseAndReserveHandlers } from './handlers'
import { authHandlers } from './authHandlers'
import { sellerReservationHandlers } from './handlers'
import { chatHandlers } from './handlers'
import { meetupHandlers } from './handlers'
import { orderFlowHandlers } from './handlers'

export const server = setupServer(
  ...listingLifecycleHandlers,
  ...browseAndReserveHandlers,
  ...sellerReservationHandlers,
  ...chatHandlers,
  ...meetupHandlers,
  ...authHandlers,
  ...orderFlowHandlers,
)