# Politica de seguranca

## Reportando uma vulnerabilidade

Nao abra uma issue publica para relatar vulnerabilidades ou credenciais expostas.
Use a opcao **Security > Advisories > Report a vulnerability** deste repositorio
para enviar o relato de forma privada.

Inclua uma descricao do impacto, os passos minimos para reproducao e, quando
possivel, uma sugestao de correcao. Evite incluir dados reais de usuarios,
tokens, senhas ou outras credenciais no relato.

## Segredos e configuracao

Segredos de execucao devem ser fornecidos por variaveis de ambiente ou pelo
gerenciador de segredos da infraestrutura. Arquivos `.env`, chaves privadas,
certificados de assinatura e pacotes locais nao devem ser versionados.

Se uma credencial for publicada, remova-la do arquivo atual nao e suficiente:
ela deve ser revogada ou rotacionada imediatamente. Depois disso, avalie a
reescrita do historico Git para remover o valor antigo.
