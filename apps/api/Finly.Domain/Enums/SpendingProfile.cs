namespace Finly.Domain.Enums;

public enum SpendingProfile
{
    // Padrao = 0 de propósito: é o valor default do CLR pra este enum, e
    // precisa coincidir com o HasDefaultValue configurado no EF Core
    // (AppDbContext) — senão o EF trata qualquer escolha explícita do primeiro
    // valor do enum como "não definido" e sobrescreve pelo default do banco.
    Padrao = 0,
    Economico = 1,
    Gastao = 2,
    Personalizado = 3
}
