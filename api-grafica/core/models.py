from django.db import models
from django.utils import timezone
from django.db.models import Sum, F # Importar o F
from django.contrib.auth.models import User
import uuid 

# ----------------------------
# Modelos de Entidades Base
# ----------------------------

class Cliente(models.Model):
    # ... (código do Cliente sem alteração) ...
    nome = models.CharField(max_length=200)
    email = models.EmailField(blank=True, null=True)
    telefone = models.CharField(max_length=20, blank=True, null=True)
    cpf_cnpj = models.CharField(max_length=18, blank=True, null=True, default=None)
    data_cadastro = models.DateTimeField(auto_now_add=True, null=True)
    observacao = models.TextField(blank=True, null=True)
    cep = models.CharField(max_length=10, blank=True, null=True)
    endereco = models.CharField(max_length=255, blank=True, null=True)
    numero = models.CharField(max_length=10, blank=True, null=True)
    bairro = models.CharField(max_length=100, blank=True, null=True)
    complemento = models.CharField(max_length=100, blank=True, null=True)
    cidade = models.CharField(max_length=100, blank=True, null=True)
    estado = models.CharField(max_length=2, blank=True, null=True)

    def __str__(self):
        return self.nome

    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"


class Produto(models.Model):
    # ... (código do Produto sem alteração) ...
    class TipoPrecificacao(models.TextChoices):
        UNICO = 'UNICO', 'Preço por Unidade'
        METRO_QUADRADO = 'M2', 'Preço por Metro Quadrado'
    nome = models.CharField(max_length=100, help_text="Nome do produto (ex: Banner em Lona)")
    tipo_precificacao = models.CharField(
        max_length=5,
        choices=TipoPrecificacao.choices,
        default=TipoPrecificacao.UNICO,
        help_text="Define como o preço do produto é calculado"
    )
    preco = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Preço por unidade ou por metro quadrado"
    )
    custo = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0, 
        help_text="Custo de PRODUÇÃO por unidade ou por metro quadrado"
    )
    estoque_atual = models.IntegerField(
        default=0, 
        null=True, 
        blank=True, 
        help_text="Quantidade atual em estoque. Nulo para serviços."
    )
    estoque_minimo = models.IntegerField(
        default=0, 
        null=True, 
        blank=True, 
        help_text="Nível de alerta para o estoque"
    )

    def __str__(self):
        return f'{self.nome} ({self.get_tipo_precificacao_display()})'

    class Meta:
        verbose_name = "Produto"
        verbose_name_plural = "Produtos"


# --- Modelo Fornecedor (MODIFICADO) ---
class Fornecedor(models.Model):
    # ... (código do Fornecedor sem alteração) ...
    nome = models.CharField(max_length=200, verbose_name="Nome do Fornecedor")
    cnpj = models.CharField(
        max_length=18,  # Armazena (ex: 00.000.000/0001-00)
        blank=True, 
        null=True, 
        unique=True, # Garante que não haja CNPJs duplicados
        verbose_name="CNPJ"
    )
    contato_nome = models.CharField(max_length=100, blank=True, null=True, verbose_name="Nome do Contato")
    telefone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    servicos_prestados = models.TextField(blank=True, null=True, help_text="Serviços principais (ex: Impressão Lona, Corte, Acrílico)")
    data_cadastro = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nome
    
    class Meta:
        verbose_name = "Fornecedor"
        verbose_name_plural = "Fornecedores"
        ordering = ['nome']


# -------------------------------------
# Modelos de Transações e Fluxo de Trabalho
# -------------------------------------

class Orcamento(models.Model):
    # ... (código do Orcamento sem alteração) ...
    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, related_name="orcamentos")
    data_criacao = models.DateTimeField(default=timezone.now)
    valor_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=50, default='Em Aberto', help_text="Ex: Em Aberto, Aprovado, Rejeitado")
    data_validade = models.DateField(blank=True, null=True, help_text="Data de validade da proposta")
    valor_frete = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    valor_desconto = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def recalcular_total(self):
        subtotal_itens = self.itens.all().aggregate(
            total_calculado=models.Sum('subtotal')
        )['total_calculado'] or 0
        total_final = subtotal_itens - self.valor_desconto + self.valor_frete
        self.valor_total = total_final if total_final > 0 else 0
        self.save(update_fields=['valor_total'])

    def __str__(self):
        return f'Orçamento #{self.id} - {self.cliente.nome}'

    class Meta:
        verbose_name = "Orçamento"
        verbose_name_plural = "Orçamentos"

    def gerar_pedido(self):
        pedido = Pedido.objects.create(
            cliente=self.cliente,
            orcamento_origem=self,
            valor_total=0,
            status_producao='Aguardando',
            status_pagamento=Pedido.StatusPagamento.PENDENTE,
            data_criacao=timezone.now()
        )
        itens_orc = list(self.itens.all())
        for io in itens_orc:
            ItemPedido.objects.create(
                pedido=pedido,
                produto=io.produto if io.produto_id else None,
                quantidade=io.quantidade,
                largura=io.largura,
                altura=io.altura,
                descricao_customizada=io.descricao_customizada,
                subtotal=io.subtotal
            )
        pedido.valor_total = self.valor_total
        pedido.save(update_fields=['valor_total'])
        return pedido


class ItemOrcamento(models.Model):
    # ... (código do ItemOrcamento sem alteração) ...
    orcamento = models.ForeignKey(Orcamento, on_delete=models.CASCADE, related_name='itens')
    produto = models.ForeignKey(Produto, on_delete=models.PROTECT, null=True, blank=True)
    quantidade = models.PositiveIntegerField(default=1)
    largura = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    altura = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    descricao_customizada = models.CharField(max_length=255, blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.subtotal:
            if self.produto.tipo_precificacao == 'M2':
                if not self.largura or not self.altura:
                    raise ValueError("Largura e Altura são obrigatórias para produtos por m²")
                self.subtotal = self.produto.preco * self.largura * self.altura * self.quantidade
            else:
                self.subtotal = self.produto.preco * self.quantidade
        super().save(*args, **kwargs)

    @property
    def nome_exibido(self):
        return self.descricao_customizada or self.produto.nome

    def __str__(self):
        base = self.descricao_customizada or self.produto.nome
        return f'{self.quantidade}x {base} (Orçamento #{self.orcamento.id})'

    class Meta:
        verbose_name = "Item de Orçamento"
        verbose_name_plural = "Itens de Orçamentos"


class Pedido(models.Model):
    # ... (código do Pedido sem alteração) ...
    class StatusPagamento(models.TextChoices):
        PENDENTE = 'PENDENTE', 'Pendente'
        PARCIAL = 'PARCIAL', 'Parcial'
        PAGO = 'PAGO', 'Pago'

    class StatusArte(models.TextChoices):
        PENDENTE = 'PENDENTE', 'Pendente'
        EM_APROVACAO = 'EM_APROVACAO', 'Em Aprovação'
        APROVADO = 'APROVADO', 'Aprovado'
        REJEITADO = 'REJEITADO', 'Rejeitado'

    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, related_name="pedidos")
    orcamento_origem = models.OneToOneField(Orcamento, on_delete=models.SET_NULL, null=True, blank=True)
    data_criacao = models.DateTimeField(default=timezone.now)
    valor_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status_producao = models.CharField(max_length=50, default='Aguardando', help_text="Ex: Aguardando Arte, Em Produção, Finalizado")
    status_pagamento = models.CharField(max_length=10, choices=StatusPagamento.choices, default=StatusPagamento.PENDENTE)
    status_arte = models.CharField(
        max_length=20,
        choices=StatusArte.choices,
        default=StatusArte.PENDENTE
    )
    token_aprovacao = models.UUIDField(
        unique=True, 
        null=True, 
        blank=True, 
        editable=False, 
        help_text="Token único para a página de aprovação do cliente"
    )
    previsto_entrega = models.DateField(blank=True, null=True)
    custo_producao = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Custo total de fornecedores (calculado por signal)")
    data_producao = models.DateField(blank=True, null=True)
    forma_envio = models.CharField(max_length=100, blank=True, null=True)
    codigo_rastreio = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f'Pedido #{self.id} - {self.cliente.nome}'
    
    def recalcular_total(self):
        for item in self.itens.all():
            item.save()
        total = self.itens.aggregate(total_calculado=Sum('subtotal'))['total_calculado']
        self.valor_total = total if total is not None else 0
        self.save(update_fields=['valor_total'])

    class Meta:
        verbose_name = "Pedido"
        verbose_name_plural = "Pedidos"


class ItemPedido(models.Model):
    # ... (código do ItemPedido sem alteração) ...
    observacoes_producao = models.TextField(
        blank=True, 
        null=True, 
        help_text="Observações internas para a produção (ex: sangria, cor especial)"
    )
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='itens')
    produto = models.ForeignKey(Produto, on_delete=models.PROTECT, null=True, blank=True)
    quantidade = models.PositiveIntegerField(default=1)
    largura = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    altura = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    descricao_customizada = models.CharField(max_length=255, blank=True, null=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        base = self.descricao_customizada or (self.produto.nome if self.produto else "Item Manual")
        return f'{self.quantidade}x {base} (Pedido #{self.pedido.id})'
    
    def save(self, *args, **kwargs):
        if not self.subtotal:
            if self.produto:
                if self.produto.tipo_precificacao == 'M2':
                    if not self.largura or not self.altura:
                        self.subtotal = 0
                    else:
                        self.subtotal = self.produto.preco * self.largura * self.altura * self.quantidade
                else:
                    self.subtotal = self.produto.preco * self.quantidade
            else:
                self.subtotal = 0
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Item de Pedido"
        verbose_name_plural = "Itens de Pedidos"

class ArtePedido(models.Model):
    # ... (código do ArtePedido sem alteração) ...
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='artes')
    layout = models.ImageField(upload_to='logos/', help_text="Arquivo de imagem da arte")
    comentarios_admin = models.TextField(blank=True, null=True, help_text="Comentários/instruções do admin")
    comentarios_cliente = models.TextField(blank=True, null=True, help_text="Comentários/revisões do cliente")
    data_upload = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Arte for Pedido #{self.pedido.id} - {self.data_upload.strftime('%d/%m/%Y')}"


class CustoFornecedorPedido(models.Model):
    # --- NOVOS CAMPOS ---
    class StatusPagamento(models.TextChoices):
        A_PAGAR = 'A PAGAR', 'A Pagar'
        PAGO = 'PAGO', 'Pago'
    
    status = models.CharField(
        max_length=10,
        choices=StatusPagamento.choices,
        default=StatusPagamento.A_PAGAR
    )
    data_vencimento = models.DateField(
        blank=True, 
        null=True,
        help_text="Data de vencimento para pagamento ao fornecedor"
    )
    data_pagamento = models.DateField(
        blank=True, 
        null=True,
        help_text="Data em que o custo foi efetivamente pago"
    )
    # -------------------

    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='custos_fornecedores')
    fornecedor = models.ForeignKey(Fornecedor, on_delete=models.PROTECT, related_name='custos')
    descricao = models.CharField(max_length=255, help_text="Descrição do serviço/produto (ex: Impressão Lona)")
    custo = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    data_criacao = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Custo de {self.fornecedor.nome} para Pedido #{self.pedido.id} (R$ {self.custo})'
    
    class Meta:
        verbose_name = "Custo de Fornecedor"
        verbose_name_plural = "Custos de Fornecedores"
        ordering = ['-data_criacao']


# ----------------------------
# Modelos Financeiros
# ----------------------------

class Despesa(models.Model):
    # --- NOVOS CAMPOS ---
    class StatusPagamento(models.TextChoices):
        A_PAGAR = 'A PAGAR', 'A Pagar'
        PAGO = 'PAGO', 'Pago'

    status = models.CharField(
        max_length=10,
        choices=StatusPagamento.choices,
        default=StatusPagamento.A_PAGAR
    )
    # O campo 'data' agora servirá como 'data_vencimento'
    data_pagamento = models.DateField(
        blank=True, 
        null=True,
        help_text="Data em que a despesa foi efetivamente paga"
    )
    # -------------------

    descricao = models.CharField(max_length=255, help_text="Descrição da despesa (ex: Aluguel)")
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    data = models.DateField(help_text="Data em que a despesa ocorreu ou foi paga") # <- MUDADO PARA data_vencimento no HELP
    categoria = models.CharField(max_length=100, blank=True, null=True, help_text="Ex: Fornecedores, Impostos, Salários")

    def __str__(self):
        return f'{self.descricao} - R$ {self.valor} em {self.data.strftime("%d/%m/%Y")}'
    
    class Meta:
        verbose_name = "Despesa"
        verbose_name_plural = "Despesas"
        ordering = ['data'] # Ordenar por data de vencimento


class Pagamento(models.Model):
    # ... (código do Pagamento sem alteração) ...
    class FormaPagamento(models.TextChoices):
        PIX = 'PIX', 'Pix'
        DINHEIRO = 'DINHEIRO', 'Dinheiro'
        CARTAO = 'CARTAO', 'Cartão'
        BOLETO = 'BOLETO', 'Boleto'

    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='pagamentos')
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    data = models.DateTimeField(default=timezone.now)
    forma_pagamento = models.CharField(max_length=50, choices=FormaPagamento.choices, default=FormaPagamento.PIX)

    def __str__(self):
        return f'Pagamento de R$ {self.valor} ({self.get_forma_pagamento_display()}) para o Pedido #{self.pedido.id}'
    

class Empresa(models.Model):
    # ... (código da Empresa sem alteração) ...
    nome_empresa = models.CharField(max_length=200, default="Gráfica Cloud Design")
    razao_social = models.CharField(max_length=200, blank=True, null=True)
    cnpj = models.CharField(max_length=18, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    whatsapp = models.CharField(max_length=20, blank=True, null=True)
    instagram = models.CharField(max_length=100, blank=True, null=True)
    site = models.URLField(max_length=255, blank=True, null=True)
    cep = models.CharField(max_length=10, blank=True, null=True)
    endereco = models.CharField(max_length=255, blank=True, null=True)
    numero = models.CharField(max_length=20, blank=True, null=True)
    bairro = models.CharField(max_length=100, blank=True, null=True)
    complemento = models.CharField(max_length=100, blank=True, null=True)
    cidade = models.CharField(max_length=100, blank=True, null=True)
    estado = models.CharField(max_length=2, blank=True, null=True)
    logo_grande_dashboard = models.ImageField(upload_to='logos/', blank=True, null=True)
    logo_pequena_dashboard = models.ImageField(upload_to='logos/', blank=True, null=True)
    logo_orcamento_pdf = models.ImageField(upload_to='logos/', blank=True, null=True)

    def __str__(self):
        return self.nome_empresa or "Configurações da Empresa"

    def save(self, *args, **kwargs):
        self.pk = 1
        super(Empresa, self).save(*args, **kwargs)

    class Meta:
        verbose_name_plural = "Empresa"


class Profile(models.Model):
    # ... (código do Profile sem alteração) ...
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    profile_pic = models.ImageField(upload_to='profile_pics/', null=True, blank=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"
    

class MovimentacaoEstoque(models.Model):
    # ... (código do MovimentacaoEstoque sem alteração) ...
    TIPO_MOVIMENTACAO = [
        ('ENTRADA_COMPRA', 'Entrada (Compra)'),
        ('ENTRADA_AJUSTE', 'Entrada (Ajuste Manual)'),
        ('SAIDA_AJUSTE', 'Saída (Ajuste Manual/Perda)'),
    ]

    produto = models.ForeignKey(Produto, on_delete=models.CASCADE, related_name='movimentacoes')
    quantidade = models.IntegerField(help_text="Positivo para entradas, Negativo para saídas")
    tipo = models.CharField(max_length=20, choices=TIPO_MOVIMENTACAO, default='ENTRADA_COMPRA')
    observacao = models.TextField(blank=True, null=True, help_text="Ex: Nota Fiscal 123, Ajuste de inventário")
    data = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"{self.get_tipo_display()} de {self.quantidade} em {self.produto.nome}"

    class Meta:
        ordering = ['-data']
        verbose_name = "Movimentação de Estoque"
        verbose_name_plural = "Movimentações de Estoque"

class EtiquetaPortaria(models.Model):
    # ... (código da EtiquetaPortaria sem alteração) ...
    TIPO_CHOICES = [
        ('CONDOMINIO', 'Cliente Condomínio'),
        ('RETIRADA', 'Cliente Retirada'),
    ]
    tipo_cliente = models.CharField(max_length=20, choices=TIPO_CHOICES, default='CONDOMINIO')
    nome_responsavel = models.CharField(max_length=255, verbose_name="Responsável pela Retirada")
    data_criacao = models.DateTimeField(default=timezone.now)
    bloco = models.CharField(max_length=100, blank=True, null=True)
    apartamento = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"Etiqueta para {self.nome_responsavel} ({self.get_tipo_cliente_display()}) - {self.data_criacao.strftime('%d/%m')}"

    class Meta:
        ordering = ['-data_criacao']
        verbose_name = "Etiqueta de Portaria"
        verbose_name_plural = "Etiquetas de Portaria"
