# diegouidev/api-grafica/api-grafica-62138a55777cc50b923f497f7da210ce889488cb/core/urls.py
# (Arquivo Corrigido e Completo)

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import (
    ClienteViewSet, ProdutoViewSet, OrcamentoViewSet, ItemOrcamentoViewSet,
    PedidoViewSet, ItemPedidoViewSet, DashboardStatsView, PagamentoViewSet, 
    DespesaViewSet, DespesaConsolidadaView, VendasRecentesView, FaturamentoPorPagamentoView, 
    RelatorioFaturamentoView, OrcamentoPDFView, PedidoPDFView, EmpresaSettingsView, UserProfileView, 
    ChangePasswordView, EmpresaPublicaView, EvolucaoVendasView, PedidosPorStatusView,
    ProdutosMaisVendidosView, ClientesMaisAtivosView, RelatorioClientesView, RelatorioPedidosView, RelatorioOrcamentosView,
    RelatorioProdutosView,
    ArtePedidoViewSet,
    AprovacaoPedidoViewSet, EtiquetaPortariaViewSet, EtiquetaPDFView, PedidosKanbanView,
    
    FornecedorViewSet, CustoFornecedorPedidoViewSet, RelatorioFornecedoresView,
    
    ConsultaCNPJView,
    PedidoProducaoPDFView,
    MovimentacaoEstoqueViewSet,
    ContasAPagarView,
    ContasAReceberView,
    FluxoCaixaView,

    # --- IMPORTAÇÕES DAS NOVAS VIEWS ---
    UserManagementViewSet,
    GroupsView
) 

router = DefaultRouter()

router.register(r'clientes', ClienteViewSet)
router.register(r'orcamentos', OrcamentoViewSet)
router.register(r'itens-orcamento', ItemOrcamentoViewSet)
router.register(r'pedidos', PedidoViewSet)
router.register(r'itens-pedido', ItemPedidoViewSet)
router.register(r'produtos', ProdutoViewSet, basename='produto')
router.register(r'pagamentos', PagamentoViewSet, basename='pagamento')
router.register(r'despesas-gerais', DespesaViewSet, basename='despesa')
router.register(r'artes-pedido', ArtePedidoViewSet, basename='artepedido')
router.register(r'etiquetas-portaria', EtiquetaPortariaViewSet, basename='etiquetaportaria')
router.register(r'fornecedores', FornecedorViewSet, basename='fornecedor')
router.register(r'custos-pedido', CustoFornecedorPedidoViewSet, basename='custopedido')
router.register(r'movimentacoes-estoque', MovimentacaoEstoqueViewSet, basename='movimentacaoestoque')

# --- REGISTRO DA VIEWSET DE USUÁRIOS ---
router.register(r'admin/users', UserManagementViewSet, basename='admin-user')


urlpatterns = [
    path('', include(router.urls)),

    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('public/empresa/', EmpresaPublicaView.as_view(), name='empresa-publica'),
    
    path(
        'public/aprovacao/<uuid:token>/', 
        AprovacaoPedidoViewSet.as_view({'get': 'retrieve'}), 
        name='aprovacao-publica-detail'
    ),
    path(
        'public/aprovacao/<uuid:token>/aprovar/', 
        AprovacaoPedidoViewSet.as_view({'post': 'aprovar'}), 
        name='aprovacao-publica-aprovar'
    ),
    path(
        'public/aprovacao/<uuid:token>/rejeitar/', 
        AprovacaoPedidoViewSet.as_view({'post': 'rejeitar'}), 
        name='aprovacao-publica-rejeitar'
    ),
    
    path('consulta-cnpj/<str:cnpj>/', ConsultaCNPJView.as_view(), name='consulta-cnpj'),
    
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('despesas/', DespesaConsolidadaView.as_view(), name='despesa-consolidada'),
    path('contas-a-pagar/', ContasAPagarView.as_view(), name='contas-a-pagar'),
    path('contas-a-receber/', ContasAReceberView.as_view(), name='contas-a-receber'),
    path('relatorios/fluxo-caixa/', FluxoCaixaView.as_view(), name='relatorio-fluxo-caixa'),

    # --- ROTA PARA LISTAR GRUPOS ---
    path('admin/groups/', GroupsView.as_view(), name='admin-groups'),
    
    path('vendas-recentes/', VendasRecentesView.as_view(), name='vendas-recentes'),
    path('faturamento-por-pagamento/', FaturamentoPorPagamentoView.as_view(), name='faturamento-por-pagamento'),
    path('relatorios/faturamento/', RelatorioFaturamentoView.as_view(), name='relatorio-faturamento'),
    path('orcamentos/<int:pk>/pdf/', OrcamentoPDFView.as_view(), name='orcamento-pdf'),
    path('pedidos/<int:pk>/pdf/', PedidoPDFView.as_view(), name='pedido-pdf'),
    path('pedidos/<int:pk>/pdf/producao/', PedidoProducaoPDFView.as_view(), name='pedido-producao-pdf'),
    path('empresa-settings/', EmpresaSettingsView.as_view(), name='empresa-settings'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('profile/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('relatorios/evolucao-vendas/', EvolucaoVendasView.as_view(), name='evolucao-vendas'),
    path('relatorios/pedidos-por-status/', PedidosPorStatusView.as_view(), name='pedidos-por-status'),
    path('relatorios/produtos-mais-vendidos/', ProdutosMaisVendidosView.as_view(), name='produtos-mais-vendidos'),
    path('relatorios/clientes-mais-ativos/', ClientesMaisAtivosView.as_view(), name='clientes-mais-ativos'),
    path('relatorios/clientes/', RelatorioClientesView.as_view(), name='relatorio-clientes'),
    path('relatorios/pedidos/', RelatorioPedidosView.as_view(), name='relatorio-pedidos'),
    path('relatorios/orcamentos/', RelatorioOrcamentosView.as_view(), name='relatorio-orcamentos'),
    path('relatorios/produtos/', RelatorioProdutosView.as_view(), name='relatorio-produtos'),
    path('relatorios/fornecedores/', RelatorioFornecedoresView.as_view(), name='relatorio-fornecedores'),
    path('etiquetas-portaria/<int:pk>/pdf/', EtiquetaPDFView.as_view(), name='etiqueta-portaria-pdf'),
    path('pedidos-kanban/', PedidosKanbanView.as_view(), name='pedidos-kanban'),
    
]