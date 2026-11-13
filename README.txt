COREIA 2026 · PWA

Esta versão foi gerada a partir do texto colado do roteiro/PDF.

CONTEÚDO
- Separador AGORA / A SEGUIR com hora da Coreia
- Todos os dias 27/11–12/12
- Atividades em cartões, detalhes expansíveis
- Texto integral de cada dia disponível dentro da própria app
- Reservas/tarefas importantes
- Alertas críticos
- Alojamentos, tax refund, transportes e emergência
- Links para pesquisa direta no Naver Map
- Marcação local de atividades concluídas
- PWA/offline após primeira abertura em HTTPS

INSTALAÇÃO
1. Publicar esta pasta num alojamento HTTPS (GitHub Pages, Netlify, Cloudflare Pages, etc.).
2. Android/Chrome: “Instalar app”.
3. iPhone/Safari: Partilhar → Adicionar ao ecrã principal.


VERSÃO v4
- removida a caixa “Atualização recente”
- dia 27 corrigido manualmente
- atividades concluídas ficam esbatidas/riscadas e o AGORA avança
- Reservas inclui pasta Google Drive e links individuais de bilhetes
- KTX: 4 links individuais + aviso para imprimir
- ficheiro lembretes_coreia_2026.ics para importar alertas no calendário

VERSÃO v5
- corrigida a separação entre atividades e secções gerais do dia
- OPÇÃO B / SE ESTIVERMOS ATRASADOS / notas semelhantes aparecem fora das atividades
- RESUMO deixa de aparecer na interface (é redundante com a lista de atividades)
- correção específica do dia 30: Cheonmasan contém apenas informação sobre Cheonmasan


VERSÃO v6
- corrige definitivamente o problema de cache das versões anteriores
- elimina caches v3/v4/v5 ao ativar
- assets com ?v=6 para forçar atualização no GitHub Pages
- indicador “v6” visível no topo da app
- Notas do dia são renderizadas fora das atividades
- Dia 30 verificado: Opção B / atrasos / resumo não aparecem dentro da última atividade


VERSÃO v8
- o separador AGORA recalcula automaticamente a cada 30 segundos
- ao regressar à app depois de estar em segundo plano, o AGORA atualiza imediatamente
- mantém funcionamento offline após uma abertura online bem-sucedida


VERSÃO v9
- botão “Verificar atualização” em INFO e versão instalada visível
- version.json permite detetar futuras versões sem reinstalar a PWA
- pesquisas Naver convertidas para nomes coreanos/moradas mais específicas
- corrigidos destinos errados (ex.: Naksan, regressos, Cheonmasan, aeroporto)
- Google Maps adicionado como fallback ao lado do Naver
- CCA Hair aparece como mapa alternativo no bloco Hongdae


VERSÃO v10
- acrescentado bloco 🚕 k.ride apenas nos troços em que o roteiro prevê/considera táxi
- distingue “Táxi recomendado” de “Táxi opcional”
- botão “Abrir k.ride” usa a página oficial da k.ride
- botão “Copiar destino” copia o destino em coreano para colar/pesquisar na app
- não é usado um deep link de destino porque a k.ride não publica um esquema público estável para isso


VERSÃO v11
- otimizada para Android
- botão “Abrir k.ride” tenta abrir diretamente a app instalada
- se a app não estiver instalada / o intent falhar, abre a Play Store
- botão “Copiar destino” mantém-se para colar o destino em coreano na k.ride


VERSÃO v12
- todos os troços que incluem táxi/k.ride passam também a mostrar Naver Map e Google Maps
- isto permite comparar transporte público com táxi no próprio cartão
- corrigido em particular 01/12 14:10 Huinnyeoul → National Maritime Museum
