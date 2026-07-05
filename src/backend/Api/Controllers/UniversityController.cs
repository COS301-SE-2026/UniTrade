using Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Modules.Identity.Models;
using Modules.ReferenceData;
using Modules.ReferenceData.University;

namespace Api.Controllers
{
    [Route("api/universities")]
    [ApiController]
    public class UniversityController : ControllerBase
    {
        private readonly IUniversityService _uni;

        public UniversityController(IUniversityService uni)
        {
            _uni = uni;
        }

        [HttpGet]
        public async Task<IActionResult> GetActiveUniversities()
        {
            var universities = await _uni.GetActiveUniversitiesAsync();

            return Ok(new { count = universities.Count, data = universities });
        }
    }
}
