from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Notificacao(models.Model):
    # Relaciona a notificação a um usuário (administrador/vendedor)
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notificacoes')
    
    # O texto que será exibido
    mensagem = models.CharField(max_length=255)
    
    # Link para onde o usuário deve ir ao clicar (ex: /pedidos/123)
    link = models.CharField(max_length=255, blank=True, null=True)
    
    # Controla se o usuário já visualizou
    lida = models.BooleanField(default=False)
    
    # Data de criação
    data_criacao = models.DateTimeField(default=timezone.now)
    
    # Identificador único para evitar duplicatas (ex: "estoque_produto_5")
    chave_unica = models.CharField(max_length=100, unique=True, blank=True, null=True)


    def __str__(self):
        return f'{self.usuario.username} - {self.mensagem[:30]}...'

    class Meta:
        ordering = ['-data_criacao'] # Sempre mostrar as mais novas primeiro
        verbose_name = "Notificação"
        verbose_name_plural = "Notificações"