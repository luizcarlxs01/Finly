using System.Text.RegularExpressions;
using Finly.Application.Interfaces;

namespace Finly.Application.Services;

/// <summary>
/// Filtro de moderação baseado em lista de termos + heurísticas de spam —
/// sem chamada externa, sem custo, sem API key. Mais raso que uma análise por
/// IA (não entende contexto/ironia), mas pega os casos óbvios de ofensa e
/// spam sem depender de nenhum serviço de terceiros.
/// </summary>
public class ContentModerationService : IContentModerationService
{
    private const int MaxLinkCount = 2;
    private const double MaxUppercaseRatio = 0.6;
    private const int MinLengthForCapsCheck = 20;

    private static readonly Regex LinkPattern = new(
        @"https?://|www\.",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    // Lista propositalmente enxuta de termos claramente ofensivos em pt-BR.
    // Objetivo é pegar o caso óbvio, não ser um dicionário exaustivo — falsos
    // negativos aqui viram fila de aprovação manual de qualquer forma, porque
    // o pior cenário é só "passou sem ser sinalizado", nunca "bloqueou à toa"
    // de um jeito silencioso (o autor não é avisado, só entra na fila).
    private static readonly string[] BlockedTerms =
    {
        "arrombado", "babaca", "bosta", "boceta", "buceta", "canalha",
        "caralho", "corno", "cuzao", "cuzão", "desgraca", "desgraça",
        "estuprador", "filho da puta", "fdp", "foda-se", "foda se",
        "idiota", "imbecil", "merda", "otario", "otário", "piranha",
        "porra", "puta", "putaria", "retardado", "vadia", "vagabundo",
        "viado", "vsf",
    };

    // Frases comuns de golpe/spam — não são ofensivas, mas indicam conteúdo
    // que não tem lugar num fórum de suporte/reclamações.
    private static readonly string[] SpamPhrases =
    {
        "ganhe dinheiro", "renda extra garantida", "empréstimo garantido",
        "clique aqui e ganhe", "compre agora", "oferta imperdível",
        "aumente seus seguidores", "dinheiro fácil", "trabalhe de casa e ganhe",
        "whatsapp:", "telegram:", "bit.ly", "tinyurl",
    };

    public ModerationResult Analyze(string title, string body)
    {
        var combined = $"{title} {body}";
        var combinedLower = combined.ToLowerInvariant();

        foreach (var term in BlockedTerms)
        {
            if (ContainsWord(combinedLower, term))
            {
                return ModerationResult.Flagged(
                    "Possível linguagem ofensiva detectada pelo filtro automático.");
            }
        }

        foreach (var phrase in SpamPhrases)
        {
            if (combinedLower.Contains(phrase, StringComparison.Ordinal))
            {
                return ModerationResult.Flagged(
                    "Padrão de spam/golpe detectado pelo filtro automático.");
            }
        }

        if (LinkPattern.Matches(combined).Count > MaxLinkCount)
        {
            return ModerationResult.Flagged(
                "Excesso de links detectado pelo filtro automático.");
        }

        var letters = combined.Where(char.IsLetter).ToArray();
        if (letters.Length >= MinLengthForCapsCheck)
        {
            var uppercaseRatio = letters.Count(char.IsUpper) / (double)letters.Length;
            if (uppercaseRatio > MaxUppercaseRatio)
            {
                return ModerationResult.Flagged(
                    "Texto majoritariamente em caixa alta, sinalizado pelo filtro automático.");
            }
        }

        return ModerationResult.Clean();
    }

    private static bool ContainsWord(string textLower, string term)
    {
        return Regex.IsMatch(textLower, $@"(?<![a-zà-ú]){Regex.Escape(term)}(?![a-zà-ú])");
    }
}
