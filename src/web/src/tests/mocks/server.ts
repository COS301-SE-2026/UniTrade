import { setupServer } from 'msw/node'
//import { listingLifecycleHandlers} from './handlers'
import { authHandlers } from './authHandlers'
//import { browseAndReserveHandlers } from './handlers'

export const server = setupServer(...authHandlers,)