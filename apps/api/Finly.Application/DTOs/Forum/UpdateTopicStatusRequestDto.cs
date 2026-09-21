using System.ComponentModel.DataAnnotations;

namespace Finly.Application.DTOs.Forum;

public class UpdateTopicStatusRequestDto
{
    [Required]
    public string Status { get; set; } = string.Empty;
}
