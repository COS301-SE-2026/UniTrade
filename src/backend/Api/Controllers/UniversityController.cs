using Infrastructure.Persistence;
using Modules.Identity.Models;
using Microsoft.AspNetCore.Mvc;
using Modules.ReferenceData;

namespace Api.Controllers
{
    [Route("api/universities")]
    [ApiController]
    public class UniversityController: ControllerBase
    {
        private readonly IUniversityService _uni;
        public UniversityController(IUniversityService uni)
        {
            _uni=uni;
        }

        [HttpGet]
        public async Task<IActionResult> GetActiveUniversities()
        {
            var universities =await _uni.GetActiveUniversitiesAsync();

            return Ok(new 
            {
                count=universities.Count,
                data=universities
            });
        }
    }
}
