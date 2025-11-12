# notificacoes/admin.py
from django.contrib import admin
from .models import Notificacao

@admin.register(Notificacao)
class NotificacaoAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'mensagem_curta', 'lida', 'data_criacao', 'link')
    list_filter = ('lida', 'data_criacao', 'usuario')
    search_fields = ('usuario__username', 'mensagem')
    list_editable = ('lida',)
    list_per_page = 30
    
    # Define campos que não devem ser editáveis (são gerados pelo sistema)
    readonly_fields = ('usuario', 'mensagem', 'link', 'data_criacao', 'chave_unica')

    @admin.display(description='Mensagem')
    def mensagem_curta(self, obj):
        return f"{obj.mensagem[:75]}..." if len(obj.mensagem) > 75 else obj.mensagem

    # Impede que administradores criem notificações manualmente
    def has_add_permission(self, request):
        return False
