using System.ComponentModel.DataAnnotations;

namespace Finly.Application.DTOs.Forum;

public class CreateTopicRequestDto
{
    [Required]
    [MaxLength(150)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(2000)]
    public string Body { get; set; } = string.Empty;
}
