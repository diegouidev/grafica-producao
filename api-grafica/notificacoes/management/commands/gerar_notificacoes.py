# api-grafica/notificacoes/management/commands/gerar_notificacoes.py
# (Novo Arquivo)

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import F
from core.models import Produto, Pedido
from notificacoes.models import Notificacao

class Command(BaseCommand):
    help = 'Verifica o sistema e gera notificações pendentes (estoque baixo, pedidos atrasados).'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Iniciando geração de notificações...'))
        
        # 1. Define para quem enviar (ex: todos os admins/staff)
        # Por simplicidade, vamos pegar o primeiro superusuário
        # Numa aplicação real, você pode querer notificar todos os 'is_staff'
        admin_user = User.objects.filter(is_superuser=True).first()
        
        if not admin_user:
            self.stdout.write(self.style.ERROR('Nenhum usuário admin encontrado para notificar.'))
            return

        # --- 2. Lógica de Estoque Baixo ---
        produtos_estoque_baixo = Produto.objects.filter(
            estoque_atual__isnull=False,
            estoque_minimo__gt=0,
            estoque_atual__lte=F('estoque_minimo')
        )
        
        count_estoque = 0
        for produto in produtos_estoque_baixo:
            # Chave única para não duplicar a notificação
            chave = f"estoque_produto_{produto.id}"
            
            # get_or_create: Tenta buscar, se não existir, cria.
            notif, created = Notificacao.objects.get_or_create(
                chave_unica=chave,
                defaults={
                    'usuario': admin_user,
                    'mensagem': f"Estoque baixo: {produto.nome} (Atual: {produto.estoque_atual})",
                    'link': f"/produtos" # Link para a página de produtos
                }
            )
            # Se a notificação já existia mas foi lida, reativamos ela
            if not created and notif.lida:
                notif.lida = False
                notif.data_criacao = timezone.now()
                notif.save()
            
            if created:
                count_estoque += 1

        self.stdout.write(self.style.SUCCESS(f'Encontrados {count_estoque} novos alertas de estoque.'))

        # --- 3. Lógica de Pedidos Atrasados ---
        hoje = timezone.now().date()
        pedidos_atrasados = Pedido.objects.filter(
            previsto_entrega__isnull=False,
            previsto_entrega__lt=hoje
        ).exclude(
            status_producao__in=['Finalizado', 'Entregue'] # Exclui os que já foram concluídos
        )
        
        count_pedidos = 0
        for pedido in pedidos_atrasados:
            chave = f"pedido_atrasado_{pedido.id}"
            
            notif, created = Notificacao.objects.get_or_create(
                chave_unica=chave,
                defaults={
                    'usuario': admin_user,
                    'mensagem': f"Pedido #{pedido.id} ({pedido.cliente.nome}) está atrasado. Previsto para: {pedido.previsto_entrega.strftime('%d/%m')}",
                    'link': f"/pedidos/{pedido.id}/editar" # Link direto para editar o pedido
                }
            )
            if not created and notif.lida:
                notif.lida = False
                notif.data_criacao = timezone.now()
                notif.save()
            
            if created:
                count_pedidos += 1

        self.stdout.write(self.style.SUCCESS(f'Encontrados {count_pedidos} novos pedidos atrasados.'))
        self.stdout.write(self.style.SUCCESS('Concluído.'))