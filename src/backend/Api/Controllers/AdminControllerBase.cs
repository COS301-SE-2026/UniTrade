using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Authorize(Roles = "admin")]
public abstract class AdminControllerBase : ControllerBase { }
