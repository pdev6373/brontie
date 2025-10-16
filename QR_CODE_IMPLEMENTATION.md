# Implementação de QR Codes com Rastreamento PostHog

## Funcionalidades Implementadas

### 1. Redirecionamento de QR Codes
- **Arquivo modificado**: `src/app/qr/[shortId]/page.tsx`
- **Funcionalidade**: QR codes agora redirecionam para `/products` com parâmetros específicos do café
- **URL gerada**: `/products?merchant={merchantId}&location={locationId}`

### 2. Seleção Automática da Aba do Café
- **Arquivo modificado**: `src/components/pages/how-it-works/AvailableGiftsFromBackend.tsx`
- **Funcionalidade**: A página de produtos detecta automaticamente o parâmetro `merchant` na URL e seleciona a aba correspondente
- **Comportamento**: Se o usuário escanear um QR code, será redirecionado para a página de produtos com a aba do café específico já selecionada

### 3. Rastreamento PostHog
- **Arquivo criado**: `src/lib/posthog-tracking.ts`
- **Eventos implementados**:
  - `qr_code_scanned`: Quando um QR code é escaneado
  - `qr_navigation_to_products`: Navegação da página de QR para produtos
  - `gift_purchase_intent`: Intenção de compra de um gift
  - `merchant_tab_changed`: Mudança de aba entre cafés
  - `county_filter_changed`: Mudança de filtro por condado
  - `show_all_toggled`: Alternância entre "Ver todos" e "Ver menos"

## Como Testar

### 1. Teste de QR Code
1. Gere um QR code através do admin (`/admin/qr-generator`)
2. Escaneie o QR code com um dispositivo móvel
3. Verifique se redireciona para `/products?merchant={id}&location={id}`
4. Verifique se a aba do café específico está selecionada automaticamente

### 2. Teste de Rastreamento PostHog
1. Abra o console do navegador
2. Verifique se os eventos estão sendo enviados para PostHog
3. Teste os seguintes fluxos:
   - Escanear QR code
   - Navegar entre abas de cafés
   - Filtrar por condado
   - Clicar em "Purchase Gift"
   - Alternar "See all" / "Show less"

### 3. Verificação de Eventos PostHog
Os seguintes eventos devem aparecer no PostHog:
- `qr_code_scanned` com propriedades: short_id, merchant_id, merchant_name, location_id, location_name, is_from_redeem_page, referrer
- `qr_navigation_to_products` com propriedades: merchant_id, merchant_name, location_id, source
- `gift_purchase_intent` com propriedades: gift_item_id, gift_name, gift_price, merchant_id, merchant_name, location_ids, location_names, active_tab, selected_county
- `merchant_tab_changed` com propriedades: tab_name, selected_county, total_gifts
- `county_filter_changed` com propriedades: selected_county, active_tab, total_gifts
- `show_all_toggled` com propriedades: show_all, active_tab, selected_county, total_gifts

## Arquivos Modificados

1. `src/app/qr/[shortId]/page.tsx` - Redirecionamento e rastreamento de QR codes
2. `src/components/pages/how-it-works/AvailableGiftsFromBackend.tsx` - Seleção automática de aba e rastreamento de interações
3. `src/lib/posthog-tracking.ts` - Utilitários de rastreamento PostHog (novo arquivo)

## Fluxo Completo

1. **Usuário escaneia QR code** → Evento `qr_code_scanned`
2. **Redirecionamento para /products** → Evento `qr_navigation_to_products`
3. **Aba do café selecionada automaticamente** → Usuário vê produtos do café específico
4. **Interações do usuário** → Eventos de rastreamento conforme necessário
5. **Clique em "Purchase Gift"** → Evento `gift_purchase_intent`

## Notas Técnicas

- O rastreamento PostHog é feito de forma defensiva (verifica se o objeto existe)
- Os eventos incluem contexto relevante para análise
- A seleção automática da aba funciona apenas quando há parâmetros na URL
- O sistema mantém compatibilidade com o fluxo existente de redeem
