using System.Runtime.CompilerServices;

namespace Modules.Chat;

public sealed class ChatException(string code) : Exception(code)
{

}

public static class ChatErrors
{
    public const string Forbidden = "forbidden";
    public const string NotActive = "not_active";
    public const string NotFound = "not_found";

}