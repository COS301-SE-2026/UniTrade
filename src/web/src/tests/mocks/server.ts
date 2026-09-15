import { setupServer } from 'msw/node'
import { listingLifecycleHandlers, browseAndReserveHandlers, chatHandlers, meetupHandlers,orderFlowHandlers , sellerReservationHandlers  } from './handlers'
import { authHandlers } from './authHandlers'


export const server = setupServer(
  ...listingLifecycleHandlers,
  ...browseAndReserveHandlers,
  ...sellerReservationHandlers,
  ...chatHandlers,
  ...meetupHandlers,
  ...authHandlers,
  ...orderFlowHandlers,
)