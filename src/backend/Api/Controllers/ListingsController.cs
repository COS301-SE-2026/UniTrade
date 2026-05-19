using namespace Modules.Listing;
using namespace Modules.Listing.Models;
using namespace Modules.Listing.Models.DTO;

namespace API.Controller
{
    [Route("api/listings")]
    [ApiController]
    
    public class AuthController: ControllerBase
    {
        private readonly IListingsService _listingsService;

        public AuthController(IListingsService listingsService)
        {
            _listingsService=listingsService;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody]CreateListingsDto request)
        {
            if(request.Title==string.Empty()|| request.Price==string.empty()|| request.Condition==string.Empty())
            {
                return BadRequest("Field(s) missing.");
            }

            var response= new _listingsService.CreateListings(request);
            return response;
        }
    }

}