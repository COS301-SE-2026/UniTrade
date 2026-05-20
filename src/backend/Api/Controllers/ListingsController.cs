using Modules.Listing;
using Modules.Listing.Models;
using Modules.Listing.Models.DTO;

namespace API.Controller
{
    [Route("api/listings")]
    [ApiController]
    
    public class ListingsController: ControllerBase
    {
        private readonly IListingsService _listingsService;

        public ListingsController(IListingsService listingsService)
        {
            _listingsService=listingsService;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody]CreateListingsDto request)
        {
            if(string.IsNullOrEmpty(request.Title)|| string.IsNullOrEmpty(request.Price)|| string.IsNullOrEmpty(request.Price))
            {
                return BadRequest("Field(s) missing.");
            }

            var response= await _listingsService.CreateListings(request);
            return response;
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update([FromBody] CreateListingsDto request,int id)
        {
            var updateL=await _listingsService.Listing.UpdateAsync;

            if(updateL==null){
                return NotFound();
            }
            return Ok(updateL);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success=await _listingsService.DeleteAsync(id);

            if(!success){
                return NotFound();
            }

            return NoContent();
        }

    }
}