from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Notificacao
from .serializers import NotificacaoSerializer
from rest_framework.permissions import IsAuthenticated

class NotificacaoViewSet(viewsets.ModelViewSet):
    """
    API endpoint para ver e gerenciar notificações.
    """
    serializer_class = NotificacaoSerializer
    permission_classes = [IsAuthenticated] # Só usuários logados podem ver

    def get_queryset(self):
        """
        Esta view só retorna notificações para o usuário
        que está fazendo a requisição.
        """
        return self.request.user.notificacoes.all()

    @action(detail=False, methods=['post'], url_path='marcar-todas-como-lidas')
    def marcar_todas_como_lidas(self, request):
        """
        Ação customizada para marcar todas as notificações
        do usuário como lidas.
        """
        request.user.notificacoes.filter(lida=False).update(lida=True)
        return Response(status=status.HTTP_204_NO_CONTENT)