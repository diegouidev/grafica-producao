# diegouidev/api-grafica/api-grafica-62138a55777cc50b923f497f7da210ce889488cb/core/serializers.py
# (Arquivo Corrigido)

from rest_framework import serializers
from django.db.models import Sum, Count 
from django.contrib.auth.models import User, Group
import re
from .models import (
    Cliente, Produto, Orcamento, ItemOrcamento, Pedido, ItemPedido, Pagamento, 
    Despesa, Empresa, Profile, ArtePedido, EtiquetaPortaria,
    Fornecedor, CustoFornecedorPedido,
    MovimentacaoEstoque
)

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['profile_pic']

class UserSerializer(serializers.ModelSerializer):
    profile_pic_url = serializers.SerializerMethodField()
    grupos = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'profile_pic_url', 
            'grupos'
        ]
        read_only_fields = ['id', 'username', 'profile_pic_url', 'grupos']
    
    def get_profile_pic_url(self, obj):
        if hasattr(obj, 'profile') and obj.profile.profile_pic:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile.profile_pic.url)
        return None

    def get_grupos(self, obj):
        if obj.is_superuser:
            return ['Admin'] 
        return list(obj.groups.values_list('name', flat=True))


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)


# --- Serializers de Gerenciamento de Usuários ---

class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['id', 'name']


class UserManagementSerializer(serializers.ModelSerializer):
    grupos = serializers.SlugRelatedField(
        many=True,
        slug_field='name',
        queryset=Group.objects.all(),
        required=False,
        source='groups'
    )
    
    password = serializers.CharField(
        write_only=True, 
        required=False, 
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'password', 
            'grupos'
        ]
        extra_kwargs = {
            'email': {'required': True}
        }

    def create(self, validated_data):
        grupos_data = validated_data.pop('groups', [])
        password = validated_data.pop('password', None)
        
        if not password:
            raise serializers.ValidationError({"password": "A senha é obrigatória ao criar um usuário."})
        
        user = User.objects.create_user(**validated_data, password=password)
        user.groups.set(grupos_data) 
        return user

    def update(self, instance, validated_data):
        grupos_data = validated_data.pop('groups', None)
        password = validated_data.pop('password', None)

        user = super().update(instance, validated_data)

        if password:
            user.set_password(password)
            user.save()

        if grupos_data is not None:
            user.groups.set(grupos_data)

        return user

# --- Fim dos Novos Serializers ---


# --- Serializers de Cliente ---
class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = [
            'id', 'nome', 'email', 'telefone', 'cpf_cnpj',
            'observacao', 'cep', 'endereco', 'numero', 'bairro', 'cidade', 'estado', 'complemento',
            'data_cadastro'
        ]
        read_only_fields = ['data_cadastro']
    
    def validate_cpf_cnpj(self, value):
        if not value:
            return value
        query = Cliente.objects.filter(cpf_cnpj=value)
        if self.instance:
            query = query.exclude(pk=self.instance.pk)
        if query.exists():
            raise serializers.ValidationError("Já existe um cliente cadastrado com este CPF/CNPJ.")
        return value

class OrcamentoHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Orcamento
        fields = ['id', 'data_criacao', 'valor_total', 'status']
        ordering = ['-data_criacao'] 

class PedidoHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Pedido
        fields = ['id', 'data_criacao', 'valor_total', 'status_producao']
        ordering = ['-data_criacao'] 

class ClienteRetrieveSerializer(serializers.ModelSerializer):
    pedidos = PedidoHistorySerializer(many=True, read_only=True)
    orcamentos = OrcamentoHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Cliente
        fields = [
            'id', 'nome', 'email', 'telefone', 'cpf_cnpj',
            'observacao', 'cep', 'endereco', 'numero', 'bairro', 'cidade', 'estado', 'complemento',
            'data_cadastro',
            'pedidos',      
            'orcamentos'    
        ]
        read_only_fields = ['data_cadastro']
# --- Fim Serializers de Cliente ---


class ProdutoResumidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Produto
        fields = ['id', 'nome']


class MovimentacaoEstoqueReadSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    
    class Meta:
        model = MovimentacaoEstoque
        fields = ['id', 'quantidade', 'tipo', 'tipo_display', 'observacao', 'data']
        read_only_fields = fields

class MovimentacaoEstoqueWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovimentacaoEstoque
        fields = ['produto', 'quantidade', 'tipo', 'observacao']
    
    def validate_quantidade(self, value):
        if value == 0:
            raise serializers.ValidationError("A quantidade não pode ser zero.")
        return value
    
    def validate(self, data):
        tipo = data.get('tipo')
        quantidade = data.get('quantidade')

        if tipo == 'SAIDA_AJUSTE' and quantidade > 0:
            raise serializers.ValidationError("Para 'Saída (Ajuste)', a quantidade deve ser um número negativo.")
        if (tipo == 'ENTRADA_COMPRA' or tipo == 'ENTRADA_AJUSTE') and quantidade < 0:
             raise serializers.ValidationError(f"Para '{dict(MovimentacaoEstoque.TIPO_MOVIMENTACAO)[tipo]}', a quantidade deve ser um número positivo.")
        
        return data

class ProdutoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Produto
        fields = ['id', 'nome', 'tipo_precificacao', 'preco', 'custo', 'estoque_atual', 'estoque_minimo']

class ProdutoDetalhadoSerializer(serializers.ModelSerializer):
    movimentacoes = MovimentacaoEstoqueReadSerializer(many=True, read_only=True)
    
    class Meta:
        model = Produto
        fields = [
            'id', 'nome', 'tipo_precificacao', 'preco', 'custo', 
            'estoque_atual', 'estoque_minimo', 'movimentacoes'
        ]


class FornecedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fornecedor
        fields = ['id', 'nome', 'cnpj', 'contato_nome', 'telefone', 'email', 'servicos_prestados', 'data_cadastro']
        read_only_fields = ['data_cadastro']
        
    def validate_cnpj(self, value):
        if not value:
            return value
        cnpj = re.sub(r'\D', '', value)
        if len(cnpj) != 14 or cnpj == cnpj[0] * 14:
            raise serializers.ValidationError("CNPJ inválido.")
        try:
            soma = 0
            peso = 5
            for i in range(12):
                soma += int(cnpj[i]) * peso
                peso -= 1
                if peso < 2:
                    peso = 9
            resto = soma % 11
            dv1 = 0 if resto < 2 else 11 - resto
            if dv1 != int(cnpj[12]):
                raise serializers.ValidationError("CNPJ inválido (dígito verificador).")
            soma = 0
            peso = 6
            for i in range(13):
                soma += int(cnpj[i]) * peso
                peso -= 1
                if peso < 2:
                    peso = 9
            resto = soma % 11
            dv2 = 0 if resto < 2 else 11 - resto
            if dv2 != int(cnpj[13]):
                raise serializers.ValidationError("CNPJ inválido (dígito verificador).")
        except (ValueError, TypeError):
             raise serializers.ValidationError("CNPJ contém caracteres inválidos.")
        query = Fornecedor.objects.filter(cnpj=value)
        if self.instance:
            query = query.exclude(pk=self.instance.pk)
        if query.exists():
            raise serializers.ValidationError("Já existe um fornecedor cadastrado com este CNPJ.")
        return value

    def validate_telefone(self, value):
        if not value:
            return value
        telefone = re.sub(r'\D', '', value)
        if len(telefone) < 10:
             raise serializers.ValidationError("Número de telefone inválido. Deve incluir DDD e ter pelo menos 10 dígitos.")
        return value


class CustoFornecedorPedidoSerializer(serializers.ModelSerializer):
    fornecedor_nome = serializers.CharField(source='fornecedor.nome', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = CustoFornecedorPedido
        fields = [
            'id', 'pedido', 'fornecedor', 'fornecedor_nome', 'descricao', 'custo',
            'status', 'status_display', 'data_vencimento', 'data_pagamento'
        ]
        read_only_fields = ['id', 'fornecedor_nome', 'status_display']


class ItemOrcamentoSerializer(serializers.ModelSerializer):
    produto = ProdutoResumidoSerializer(read_only=True)
    nome_exibido = serializers.SerializerMethodField()
    class Meta:
        model = ItemOrcamento
        fields = ['id', 'produto', 'quantidade', 'largura', 'altura', 'descricao_customizada', 'subtotal', 'nome_exibido']
    def get_nome_exibido(self, obj):
        return obj.descricao_customizada or (obj.produto.nome if obj.produto else 'Item')

class ItemOrcamentoWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemOrcamento
        fields = ['produto', 'quantidade', 'largura', 'altura', 'descricao_customizada', 'subtotal']
        extra_kwargs = {'subtotal': {'required': False}}
    produto = serializers.PrimaryKeyRelatedField(
        queryset=Produto.objects.all(),
        required=False,
        allow_null=True   
    )

class ClienteResumidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = ['id', 'nome']

class OrcamentoSerializer(serializers.ModelSerializer):
    cliente = ClienteResumidoSerializer(read_only=True)
    itens = ItemOrcamentoSerializer(many=True, read_only=True)
    itens_write = ItemOrcamentoWriteSerializer(many=True, write_only=True, source='itens', required=False)
    cliente_id = serializers.PrimaryKeyRelatedField(queryset=Cliente.objects.all(), source='cliente', write_only=True)
    class Meta:
        model = Orcamento
        fields = [
            'id', 'cliente', 'data_criacao', 'valor_total', 'status', 
            'valor_frete', 'valor_desconto', 'data_validade',
            'itens', 'cliente_id', 'itens_write'
        ]
        read_only_fields = ['valor_total', 'data_criacao']
    def create(self, validated_data):
        itens_data = validated_data.pop('itens', [])
        orcamento = Orcamento.objects.create(**validated_data) 
        for item in itens_data:
            ItemOrcamento.objects.create(orcamento=orcamento, **item)
        orcamento.recalcular_total() 
        return orcamento
    def update(self, instance, validated_data):
        itens_data = validated_data.pop('itens', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if itens_data is not None:
            instance.itens.all().delete()
            for item in itens_data:
                ItemOrcamento.objects.create(orcamento=instance, **item)
        instance.recalcular_total()
        return instance

class ItemPedidoSerializer(serializers.ModelSerializer):
    produto = ProdutoResumidoSerializer(read_only=True)
    nome_exibido = serializers.SerializerMethodField()
    class Meta:
        model = ItemPedido
        fields = [
            'id', 'produto', 'quantidade', 'largura', 'altura', 
            'descricao_customizada', 'subtotal', 'nome_exibido',
            'observacoes_producao'
        ]
    def get_nome_exibido(self, obj):
        return obj.descricao_customizada or (obj.produto.nome if obj.produto else 'Item')

class ItemPedidoWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemPedido
        fields = [
            'produto', 'quantidade', 'largura', 'altura', 
            'descricao_customizada', 'subtotal',
            'observacoes_producao'
        ]
        extra_kwargs = {
            'subtotal': {'required': False},
            'observacoes_producao': {'required': False} 
        }

class PagamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pagamento
        fields = ['id', 'pedido', 'valor', 'data', 'forma_pagamento']

class ArtePedidoSerializer(serializers.ModelSerializer):
    layout = serializers.ImageField()
    class Meta:
        model = ArtePedido
        fields = [
            'id', 'pedido', 'layout', 'comentarios_admin', 
            'comentarios_cliente', 'data_upload'
        ]
        read_only_fields = ['data_upload', 'comentarios_cliente']

class PedidoSerializer(serializers.ModelSerializer):
    cliente = ClienteResumidoSerializer(read_only=True)
    itens = ItemPedidoSerializer(many=True, read_only=True)
    pagamentos = PagamentoSerializer(many=True, read_only=True)
    artes = ArtePedidoSerializer(many=True, read_only=True)
    custos_fornecedores = CustoFornecedorPedidoSerializer(many=True, read_only=True)
    valor_pago = serializers.SerializerMethodField()
    valor_a_receber = serializers.SerializerMethodField()
    itens_write = ItemPedidoWriteSerializer(many=True, write_only=True, source='itens', required=False)
    cliente_id = serializers.PrimaryKeyRelatedField(queryset=Cliente.objects.all(), source='cliente', write_only=True, required=False)
    class Meta:
        model = Pedido
        fields = [
            'id', 'cliente', 'data_criacao', 'valor_total', 'status_producao', 'status_pagamento',
            'status_arte', 'token_aprovacao', 'orcamento_origem', 
            'itens', 'artes', 'pagamentos', 'custo_producao', 
            'custos_fornecedores', 'valor_pago', 'valor_a_receber',
            'previsto_entrega', 'data_producao', 'forma_envio', 'codigo_rastreio',
            'itens_write', 'cliente_id'
        ]
        read_only_fields = ['valor_total', 'data_criacao', 'orcamento_origem', 'custo_producao', 'custos_fornecedores']
    def get_valor_pago(self, obj):
        total_pago = obj.pagamentos.aggregate(total=Sum('valor'))['total']
        return total_pago or 0
    def get_valor_a_receber(self, obj):
        valor_pago = self.get_valor_pago(obj)
        return (obj.valor_total or 0) - (valor_pago or 0)
    def create(self, validated_data):
        itens_data = validated_data.pop('itens', [])
        pedido = Pedido.objects.create(**validated_data)
        for item in itens_data:
            ItemPedido.objects.create(pedido=pedido, **item)
        pedido.recalcular_total()
        return pedido
    def update(self, instance, validated_data):
        itens_data = validated_data.pop('itens', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if itens_data is not None:
            instance.itens.all().delete()
            for item in itens_data:
                ItemPedido.objects.create(pedido=instance, **item)
        instance.recalcular_total()
        return instance

class DespesaSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Despesa
        fields = [
            'id', 'descricao', 'valor', 'data', 'categoria', 
            'status', 'status_display', 'data_pagamento' 
        ]
        read_only_fields = ['status_display']


class DespesaConsolidadaSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    descricao = serializers.CharField()
    valor = serializers.DecimalField(max_digits=10, decimal_places=2)
    data = serializers.DateField()
    categoria = serializers.CharField(allow_null=True)
    tipo = serializers.CharField()


class ContasAPagarSerializer(serializers.Serializer):
    id = serializers.CharField()
    tipo = serializers.CharField() 
    descricao = serializers.CharField()
    valor = serializers.DecimalField(max_digits=10, decimal_places=2)
    data_vencimento = serializers.DateField()
    status = serializers.CharField()
    endpoint_type = serializers.CharField() 
    original_id = serializers.IntegerField()

class EmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empresa
        fields = '__all__'

class EmpresaPublicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empresa
        fields = ['nome_empresa', 'logo_grande_dashboard']

class RelatorioClienteSerializer(serializers.ModelSerializer):
    total_gasto = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    ultimo_pedido = serializers.DateField(read_only=True)
    dias_inativo = serializers.SerializerMethodField()
    class Meta:
        model = Cliente
        fields = ['id', 'nome', 'telefone', 'cpf_cnpj', 'total_gasto', 'ultimo_pedido', 'dias_inativo']
    def get_dias_inativo(self, obj):
        if hasattr(obj, 'dias_inativo') and obj.dias_inativo:
            return obj.dias_inativo.days
        return None

class RelatorioPedidosAtrasadosSerializer(serializers.ModelSerializer):
    cliente_nome = serializers.CharField(source='cliente.nome')
    dias_atraso = serializers.SerializerMethodField()
    class Meta:
        model = Pedido
        fields = ['id', 'cliente_nome', 'dias_atraso']
    def get_dias_atraso(self, obj):
        if hasattr(obj, 'dias_atraso') and obj.dias_atraso:
            return obj.dias_atraso.days
        return 0

class FormaPagamentoAgrupadoSerializer(serializers.Serializer):
    forma_pagamento = serializers.CharField()
    value = serializers.IntegerField()

class StatusOrcamentoAgrupadoSerializer(serializers.Serializer):
    status = serializers.CharField()
    value = serializers.IntegerField()

class ProdutosOrcadosAgrupadoSerializer(serializers.Serializer):
    produto__nome = serializers.CharField()
    value = serializers.IntegerField()

class RelatorioOrcamentoRecenteSerializer(serializers.ModelSerializer):
    cliente_nome = serializers.CharField(source='cliente.nome')
    produto_principal = serializers.SerializerMethodField()
    class Meta:
        model = Orcamento
        fields = ['id', 'cliente_nome', 'produto_principal', 'valor_total', 'data_criacao', 'status']
    def get_produto_principal(self, obj):
        primeiro_item = obj.itens.first()
        if primeiro_item:
            return primeiro_item.nome_exibido
        return "N/A"
    
class RelatorioProdutoVendidoSerializer(serializers.Serializer):
    name = serializers.CharField(source='produto__nome')
    value = serializers.IntegerField(source='total_vendido')

# --- INÍCIO DA CORREÇÃO ---
# O erro indica que esta classe estava como ModelSerializer
# Ela deve ser um serializers.Serializer simples.
class RelatorioProdutoLucrativoSerializer(serializers.Serializer): 
    name = serializers.CharField(source='produto__nome')
    margem = serializers.DecimalField(max_digits=5, decimal_places=2)
    total_lucro = serializers.DecimalField(max_digits=10, decimal_places=2)
    # Sem 'class Meta' porque não é um ModelSerializer
# --- FIM DA CORREÇÃO ---

class RelatorioProdutoBaixaDemandaSerializer(serializers.ModelSerializer):
    ultima_venda = serializers.DateField(read_only=True)
    dias_sem_venda = serializers.IntegerField(read_only=True)
    class Meta:
        model = Produto
        fields = ['id', 'nome', 'preco', 'ultima_venda', 'dias_sem_venda']

class RelatorioProdutoAlertaEstoqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Produto
        fields = ['id', 'nome', 'estoque_atual', 'estoque_minimo']

class RelatorioFornecedorGastoSerializer(serializers.Serializer):
    name = serializers.CharField(source='fornecedor__nome')
    total_gasto = serializers.DecimalField(max_digits=10, decimal_places=2)

class RelatorioFornecedorUsoSerializer(serializers.Serializer):
    name = serializers.CharField(source='fornecedor__nome')
    total_pedidos = serializers.IntegerField()

class ItemPedidoPublicSerializer(serializers.ModelSerializer):
    nome_exibido = serializers.SerializerMethodField()
    class Meta:
        model = ItemPedido
        fields = ['id', 'quantidade', 'nome_exibido', 'subtotal']
    def get_nome_exibido(self, obj):
        return obj.descricao_customizada or (obj.produto.nome if obj.produto else 'Item')

class ArtePedidoPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArtePedido
        fields = ['id', 'layout', 'comentarios_admin', 'comentarios_cliente', 'data_upload']

class PedidoAprovacaoPublicoSerializer(serializers.ModelSerializer):
    cliente_nome = serializers.CharField(source='cliente.nome', read_only=True)
    itens = ItemPedidoPublicSerializer(many=True, read_only=True)
    artes = ArtePedidoPublicSerializer(many=True, read_only=True)
    class Meta:
        model = Pedido
        fields = [
            'id', 'cliente_nome', 'status_arte', 'itens', 'artes', 'valor_total'
        ]
        read_only_fields = fields

class PedidoRejeicaoSerializer(serializers.Serializer):
    comentarios_cliente = serializers.CharField(required=True, allow_blank=False)

class EtiquetaPortariaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EtiquetaPortaria
        fields = [
            'id', 'tipo_cliente', 'nome_responsavel', 'data_criacao', 
            'bloco', 'apartamento'
        ]
        read_only_fields = ['data_criacao']

class PedidoKanbanSerializer(serializers.ModelSerializer):
    cliente_nome = serializers.CharField(source='cliente.nome', read_only=True)
    valor_formatado = serializers.SerializerMethodField()
    previsto_entrega_formatado = serializers.SerializerMethodField()
    class Meta:
        model = Pedido
        fields = [
            'id', 
            'cliente_nome', 
            'valor_formatado', 
            'previsto_entrega_formatado',
            'status_producao'
        ]
    def get_valor_formatado(self, obj):
        return f"R$ {obj.valor_total:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    def get_previsto_entrega_formatado(self, obj):
        if obj.previsto_entrega:
            return obj.previsto_entrega.strftime('%d/%m/%Y')
        return None

class ContasAReceberSerializer(serializers.ModelSerializer):
    """
    Serializer leve para a lista de Contas a Receber,
    baseado no modelo Pedido.
    """
    cliente_nome = serializers.CharField(source='cliente.nome', read_only=True)
    valor_pago = serializers.SerializerMethodField()
    valor_a_receber = serializers.SerializerMethodField()

    class Meta:
        model = Pedido
        fields = [
            'id',
            'cliente_nome',
            'data_criacao',
            'status_pagamento',
            'valor_total',
            'valor_pago',
            'valor_a_receber'
        ]
    
    def get_valor_pago(self, obj):
        # Reutiliza a lógica do PedidoSerializer
        total_pago = obj.pagamentos.aggregate(total=Sum('valor'))['total']
        return total_pago or 0

    def get_valor_a_receber(self, obj):
        # Reutiliza a lógica do PedidoSerializer
        valor_pago = self.get_valor_pago(obj)
        return (obj.valor_total or 0) - (valor_pago or 0)

class FluxoCaixaSerializer(serializers.Serializer):
    """
    Serializer para os dados agregados do gráfico de Fluxo de Caixa.
    """
    date = serializers.DateField()
    inflows = serializers.DecimalField(max_digits=12, decimal_places=2)
    outflows = serializers.DecimalField(max_digits=12, decimal_places=2)