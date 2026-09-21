using System.ComponentModel.DataAnnotations;

namespace Finly.Application.DTOs.Forum;

public class CreateReplyRequestDto
{
    [Required]
    [MaxLength(2000)]
    public string Body { get; set; } = string.Empty;
}
