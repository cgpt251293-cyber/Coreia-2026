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


VERSÃO v13
- botão “Abrir k.ride” passa a usar o link oficial “Start app” da Kakao Mobility
- este link deve abrir a app k.ride instalada e só encaminhar para a loja quando necessário
- removido o intent Android artesanal que estava a cair diretamente na Play Store


VERSÃO v14
- auditadas as atividades de deslocação em todos os dias
- Naver/Google passam a apontar para o DESTINO do movimento, não para a origem
- corrigido 29/11 “Sair do hotel” → Seomyeon Station
- corrigidos vários outros casos: Sungnyemun → Seoul Station, Hangang Bus → Jamsil pier, etc.
- botões de deslocação identificados como “Naver → destino” / “Google → destino”


VERSÃO v15
- acrescentado modo “Atraso / perda do voo”
- ativação reversível em ALERTAS ou INFO
- 27/11 passa para reacomodação
- 28/11 passa a ser chegada a Incheon + transferência noturna para Busan
- turismo do dia 28 é marcado como perdido
- 29/11 recebe blocos de chegada cedo a Busan + descanso curto, mantendo Christmas Village
- roteiro normal nunca é apagado; basta desativar o modo


VERSÃO v16
- modo atraso de voo passa a refletir o voo real: SK987 CPH 23:20 do dia seguinte
- 27/11 = roteiro turístico completo em Copenhaga
- inclui Rosenborg/Kongens Have, Round Tower opcional, Strøget, Højbro Plads Christmas Market, Nyhavn, Amalienborg e Christmas in Tivoli
- regresso ao CPH ~19:20–19:30 para voo 23:20
- eventos de Copenhaga usam Google Maps em vez de Naver
- 28/11 = chegada ICN 19:00 + transferência noturna para Busan


VERSÃO v17
- acrescentado 13/12: escala de regresso em Copenhaga 05:25–15:05
- roteiro compacto: Nyhavn, Amalienborg/Marmorkirken, Rosenborg/Kongens Have, pequeno-almoço, Strøget e Christiansborg
- inclui controlo Schengen/EES e instruções específicas para viajante brasileiro
- regresso ao CPH ~11:30–11:45, mais de 3 h antes do voo
- AGORA passa a respeitar o fuso de cada dia: Coreia nos dias coreanos e Europe/Copenhagen nos dias em Copenhaga
- corrigido também o modo alternativo de 27/11 para usar hora de Copenhaga


VERSÃO v18
- acrescentada nota de ótica no dia 03/12 em Myeongdong
- Uteum 50 Myeongdong como opção económica
- reservar 45–60 min; sem marcação obrigatória confirmada
- pedir lentes tóricas mensais para miopia + astigmatismo e conforto para olhos secos
- Biofinity Toric como primeira opção; B+L ULTRA / Air Optix HydraGlyde como alternativas
- levar óculos atuais e caixas/foto da graduação das lentes
- tax refund da filial não confirmado: perguntar antes de pagar e levar passaporte
- mapa direto para 으뜸50안경 명동점


VERSÃO v20
- 28/11: Beauty Play Busan em Seomyeon para análise de pele gratuita (~20–30 min)
- 30/11: Olive Young Nampo mantém-se com prioridade para SCALP SCAN
- removidas as referências à CCA Hair/permanente do roteiro
- mantida a nota da ótica Uteum 50 no dia 03/12


VERSÃO v21
- 28/11: Hurshimchung sem early check-in; ZM passou para ~11:00/11:15 e não é sacrificado
- 28/11: Beauty Play ~13:15; Baskin-Robbins 100 Flavor Seomyeon depois de Gwangalli
- early check-in: dormir no hotel e saltar Hurshimchung
- voo perdido: Beauty Play eliminado; dia 30 passa a SKIN + SCALP SCAN
- voo perdido: ZM recuperado em 29/11 com táxi Yonggungsa → ZM
- 05/12: MUSINSA STANDARD Hongdae + TRIBE Souffle & Coffee
- 09/12: Hyundai City Outlet Dongdaemun mantido; prioridade a sapatilhas/sportswear no 5F; Gimpo não entra
- 01/12: Baskin 100 Flavor como fallback
- 11/12: Seoul Light Gwanghwamun acrescentado na noite de abertura; Gwanghwamun Market opcional depois
- 12/12: Seoul Light passa a fallback/revisita; Gwanghwamun Market confirmado


VERSÃO v22
- descrições/resumos e detalhes das atividades podem ser editados no telemóvel
- apenas o telemóvel com credencial GitHub de escrita mostra os controlos de edição
- o token fica exclusivamente no localStorage desse telemóvel; nunca entra no código nem no ficheiro partilhado
- os restantes telemóveis são só de leitura e recebem shared-overrides.json automaticamente
- alterações feitas offline ficam pendentes e são sincronizadas quando a Internet regressa
- botão Restaurar original cria uma alteração de reposição partilhada
- estado de sincronização visível no topo e em INFO
- sincronização pré-configurada para cgpt251293-cyber/Coreia-2026 (branch main); os leitores não precisam de configurar nada
- token recomendado: fine-grained PAT restrito ao repositório da viagem, Contents: Read and write
