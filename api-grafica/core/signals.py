from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from .models import (
    ItemOrcamento, ItemPedido, Produto, Pedido, 
    CustoFornecedorPedido, MovimentacaoEstoque # <-- 1. IMPORTAR MOVIMENTACAO
)
from django.db.models import F, Sum
from django.contrib.auth.models import User
from .models import Profile

# --- FUNÇÃO ANTIGA (Manter) ---
@receiver([post_save, post_delete], sender=ItemOrcamento)
def atualizar_total_orcamento(sender, instance, **kwargs):
    """
    Gatilho para recalcular o valor total de um orçamento sempre que
    um de seus itens for salvo ou deletado.
    """
    instance.orcamento.recalcular_total()


# --- SIGNALS DE ESTOQUE (ItemPedido) ATUALIZADOS ---

@receiver(pre_save, sender=ItemPedido)
def guardar_quantidade_anterior_itempedido(sender, instance, **kwargs):
    """
    Antes de salvar um ItemPedido, guarda a quantidade antiga (se existir)
    para calcular a diferença do estoque.
    """
    if instance.pk: # Se o objeto já existe (é um update)
        try:
            instance._quantidade_anterior = ItemPedido.objects.get(pk=instance.pk).quantidade
        except ItemPedido.DoesNotExist:
            instance._quantidade_anterior = 0
    else: # É um objeto novo
        instance._quantidade_anterior = 0

@receiver(post_save, sender=ItemPedido)
def abater_estoque_itempedido(sender, instance, created, **kwargs):
    """
    Gatilho para ABATER ou AJUSTAR o estoque de um produto quando um
    ItemPedido é CRIADO ou ATUALIZADO.
    """
    produto = instance.produto
    if produto and produto.estoque_atual is not None:
        
        # Calcula a diferença do que precisa ser abatido
        # Se for novo: diff = 5 (nova) - 0 (anterior) = 5 (abate 5)
        # Se for update: diff = 7 (nova) - 5 (anterior) = 2 (abate mais 2)
        # Se for update: diff = 3 (nova) - 5 (anterior) = -2 (devolve 2)
        diferenca_quantidade = instance.quantidade - instance._quantidade_anterior
        
        if diferenca_quantidade != 0:
            Produto.objects.filter(id=produto.id).update(
                estoque_atual=F('estoque_atual') - diferenca_quantidade
            )

@receiver(post_delete, sender=ItemPedido)
def devolver_estoque_itempedido(sender, instance, **kwargs):
    """
    Gatilho para DEVOLVER o estoque de um produto quando um
    ItemPedido é DELETADO.
    """
    produto = instance.produto
    
    if produto and produto.estoque_atual is not None:
        # Devolve a quantidade total que estava no item
        Produto.objects.filter(id=produto.id).update(
            estoque_atual=F('estoque_atual') + instance.quantidade
        )

# ---------------------------------------------------


@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    """ 
    Cria um Perfil se for um novo usuário.
    Garante que um perfil exista se for um usuário antigo.
    """
    if created:
        Profile.objects.create(user=instance)
    else:
        # Garante que usuários antigos (criados ANTES do modelo Profile)
        # também tenham um perfil criado ao serem atualizados.
        Profile.objects.get_or_create(user=instance)



@receiver([post_save, post_delete], sender=CustoFornecedorPedido)
def atualizar_custo_producao_pedido(sender, instance, **kwargs):
    """
    Gatilho para recalcular o Pedido.custo_producao sempre que
    um CustoFornecedorPedido for salvo ou deletado.
    """
    pedido = instance.pedido
    
    # Calcula a soma de TODOS os custos de fornecedores para ESSE pedido
    total_custos = pedido.custos_fornecedores.aggregate(
        total=Sum('custo')
    )['total'] or 0
    
    # Atualiza o campo custo_producao no modelo Pedido
    pedido.custo_producao = total_custos
    pedido.save(update_fields=['custo_producao'])


# --- NOVO SIGNAL: ATUALIZAR ESTOQUE NA MOVIMENTAÇÃO ---
@receiver(post_save, sender=MovimentacaoEstoque)
def atualizar_estoque_por_movimentacao(sender, instance, created, **kwargs):
    """
    Gatilho para atualizar o estoque do produto quando uma
    MovimentacaoEstoque é CRIADA.
    """
    # Este signal só roda na CRIAÇÃO (created=True)
    # para evitar duplicidade se alguém editar a movimentação.
    if created:
        produto = instance.produto
        if produto.estoque_atual is None:
            # Se o produto for um serviço (sem estoque), inicializa como 0
            produto.estoque_atual = 0
        
        # 'instance.quantidade' já é positivo para entradas e negativo para saídas
        # Usamos F() para segurança em concorrência
        Produto.objects.filter(id=produto.id).update(
            estoque_atual=F('estoque_atual') + instance.quantidade
        )