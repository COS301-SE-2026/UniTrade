namespace Modules.Disputes.Models;

public class CaseNote
{
    public Guid NoteId { get; set; }
    public Guid CaseId { get; set; }
    public Guid AuthorAdminId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
