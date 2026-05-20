using Infrastructure.Persistence;
using Modules.Identity.Models;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers
{
    [Route("api/universities")]
    [ApiController]
    public class UniversityController: ControllerBase
    {
        private readonly AppDbContext _context;
        public UniversityController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult GetActiveUniversities()
        {
            try
            {
                var universities = _context.Universities.Where(u=> u.IsActive).Select(u=> new
                {
                    u.UniversityId,
                    u.Name,
                    u.EmailDomain
                }).ToList();

                return Ok(new
                {
                    count = universities.Count,
                    data = universities
                });
            }
            catch
            {
                return StatusCode(500, new { message = "An error occurred while fetching universities" });
            }
        }
    }
}
