# core/admin.py

from django.contrib import admin
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
    MovimentacaoEstoque
)

# Registros simples (para visualização rápida)
admin.site.register(Cliente)
admin.site.register(Produto)
admin.site.register(Orcamento)
admin.site.register(ItemOrcamento)
admin.site.register(Pedido)
admin.site.register(ItemPedido)
admin.site.register(ArtePedido)
admin.site.register(EtiquetaPortaria)
admin.site.register(Fornecedor)
admin.site.register(MovimentacaoEstoque)

# Registros customizados para os modelos financeiros

@admin.register(Despesa)
class DespesaAdmin(admin.ModelAdmin):
    list_display = ('descricao', 'valor', 'categoria', 'data', 'status', 'data_pagamento')
    list_filter = ('status', 'categoria', 'data')
    search_fields = ('descricao', 'categoria')

@admin.register(CustoFornecedorPedido)
class CustoFornecedorPedidoAdmin(admin.ModelAdmin):
    list_display = ('get_pedido_id', 'fornecedor', 'descricao', 'custo', 'status', 'data_vencimento', 'data_pagamento')
    list_filter = ('status', 'fornecedor', 'data_vencimento')
    search_fields = ('descricao', 'pedido__id', 'fornecedor__nome')

    @admin.display(description='Pedido #')
    def get_pedido_id(self, obj):
        return obj.pedido.id