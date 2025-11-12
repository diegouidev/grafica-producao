# core/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User

from .models import (
    Cliente,
    Produto,
    Orcamento,
    ItemOrcamento,
    Pedido,
    ItemPedido,
    Despesa,
    ArtePedido, 
    EtiquetaPortaria,
    Fornecedor,
    CustoFornecedorPedido,
    MovimentacaoEstoque,
    Pagamento,
    Empresa,
    Profile
)

# --- Inlines (para mostrar modelos relacionados dentro de outros) ---

class ItemOrcamentoInline(admin.TabularInline):
    model = ItemOrcamento
    fields = ('produto', 'descricao_customizada', 'quantidade', 'largura', 'altura', 'subtotal')
    extra = 1
    readonly_fields = ('subtotal',) # O subtotal é calculado no 'save'

class ItemPedidoInline(admin.TabularInline):
    model = ItemPedido
    fields = ('produto', 'descricao_customizada', 'quantidade', 'largura', 'altura', 'subtotal', 'observacoes_producao')
    extra = 1
    readonly_fields = ('subtotal',)

class ArtePedidoInline(admin.StackedInline): # 'Stacked' é melhor para imagens
    model = ArtePedido
    fields = ('layout', 'comentarios_admin', 'comentarios_cliente', 'data_upload')
    readonly_fields = ('data_upload',)
    extra = 0

class CustoFornecedorPedidoInline(admin.TabularInline):
    model = CustoFornecedorPedido
    fields = ('fornecedor', 'descricao', 'custo', 'status', 'data_vencimento', 'data_pagamento')
    extra = 0

class PagamentoInline(admin.TabularInline):
    model = Pagamento
    fields = ('valor', 'data', 'forma_pagamento')
    readonly_fields = ('data',)
    extra = 0

class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = 'Perfil'

# --- Administradores Customizados ---

@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ('nome', 'email', 'telefone', 'cpf_cnpj')
    search_fields = ('nome', 'email', 'cpf_cnpj', 'telefone')
    list_per_page = 25

@admin.register(Produto)
class ProdutoAdmin(admin.ModelAdmin):
    list_display = ('nome', 'tipo_precificacao', 'preco', 'custo', 'estoque_atual', 'estoque_minimo')
    list_filter = ('tipo_precificacao',)
    search_fields = ('nome',)
    list_editable = ('preco', 'custo', 'estoque_atual', 'estoque_minimo')
    list_per_page = 25

@admin.register(Fornecedor)
class FornecedorAdmin(admin.ModelAdmin):
    list_display = ('nome', 'cnpj', 'contato_nome', 'telefone', 'email')
    search_fields = ('nome', 'cnpj', 'contato_nome')

@admin.register(Orcamento)
class OrcamentoAdmin(admin.ModelAdmin):
    inlines = [ItemOrcamentoInline]
    list_display = ('id', 'cliente', 'data_criacao', 'valor_total', 'status', 'data_validade')
    list_filter = ('status', 'data_criacao', 'data_validade')
    search_fields = ('cliente__nome', 'id')
    readonly_fields = ('valor_total',) # Calculado pela função do modelo
    date_hierarchy = 'data_criacao'
    list_per_page = 20

@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    inlines = [
        ItemPedidoInline, 
        PagamentoInline, 
        CustoFornecedorPedidoInline, 
        ArtePedidoInline
    ]
    list_display = ('id', 'cliente', 'data_criacao', 'valor_total', 'status_producao', 'status_pagamento', 'status_arte', 'previsto_entrega')
    list_filter = ('status_producao', 'status_pagamento', 'status_arte', 'data_criacao', 'previsto_entrega')
    search_fields = ('cliente__nome', 'id')
    readonly_fields = ('valor_total', 'custo_producao', 'token_aprovacao')
    date_hierarchy = 'data_criacao'
    list_per_page = 20

@admin.register(Despesa)
class DespesaAdmin(admin.ModelAdmin):
    list_display = ('descricao', 'valor', 'categoria', 'data', 'status', 'data_pagamento')
    list_filter = ('status', 'categoria', 'data')
    search_fields = ('descricao', 'categoria')
    list_editable = ('status', 'data_pagamento')

@admin.register(CustoFornecedorPedido)
class CustoFornecedorPedidoAdmin(admin.ModelAdmin):
    list_display = ('get_pedido_id', 'fornecedor', 'descricao', 'custo', 'status', 'data_vencimento', 'data_pagamento')
    list_filter = ('status', 'fornecedor', 'data_vencimento')
    search_fields = ('descricao', 'pedido__id', 'fornecedor__nome')
    list_editable = ('status', 'data_pagamento')

    @admin.display(description='Pedido #', ordering='pedido__id')
    def get_pedido_id(self, obj):
        return obj.pedido.id

@admin.register(MovimentacaoEstoque)
class MovimentacaoEstoqueAdmin(admin.ModelAdmin):
    list_display = ('produto', 'quantidade', 'tipo', 'data', 'observacao')
    list_filter = ('tipo', 'data', 'produto')
    search_fields = ('produto__nome', 'observacao')
    readonly_fields = ('data',)
    date_hierarchy = 'data'

@admin.register(EtiquetaPortaria)
class EtiquetaPortariaAdmin(admin.ModelAdmin):
    list_display = ('nome_responsavel', 'tipo_cliente', 'bloco', 'apartamento', 'data_criacao')
    list_filter = ('tipo_cliente', 'data_criacao')
    search_fields = ('nome_responsavel', 'bloco', 'apartamento')

@admin.register(Empresa)
class EmpresaAdmin(admin.ModelAdmin):
    # Impede que novos objetos de Empresa sejam criados (Singleton)
    def has_add_permission(self, request):
        return False
    
    # Impede que o objeto Empresa seja deletado
    def has_delete_permission(self, request, obj=None):
        return False

# Desregistra o Admin de Usuário padrão
admin.site.unregister(User)

# Registra o novo Admin de Usuário com o Perfil inline
@admin.register(User)
class CustomUserAdmin(BaseUserAdmin):
    inlines = (ProfileInline,)
