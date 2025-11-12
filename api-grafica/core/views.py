# diegouidev/api-grafica/api-grafica-62138a55777cc50b923f497f7da210ce889488cb/core/views.py
# (Arquivo Corrigido e Completo)

from rest_framework import viewsets, status, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Pedido, Despesa, Pagamento, CustoFornecedorPedido
from django.db import transaction
import datetime
import uuid 
from django.http import HttpResponse
from django.template.loader import render_to_string
from weasyprint import HTML, CSS
from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Avg, Sum, Q, Value, CharField, Max, F, ExpressionWrapper, fields, Count, DecimalField, Case, When
from django.utils import timezone
from django.db.models.functions import TruncMonth, Coalesce, TruncDay
from decimal import Decimal
from collections import defaultdict
from django.contrib.auth.models import User, Group
from django.utils.timezone import now

import requests
import re
from itertools import chain 

from .permissions import (
    IsAdmin,
    CanAccessFinance,
    CanAccessPedidos,
    CanAccessClientes,
    CanAccessKanban,
    CanAccessReports,
    IsAdminOrProducao
)

from .models import (
    Cliente, Produto, Orcamento, ItemOrcamento, ItemPedido, Empresa,
    ArtePedido, EtiquetaPortaria,
    Fornecedor,
    MovimentacaoEstoque
)
# --- Bloco de importação COMPLETO ---
from .serializers import (
    ClienteSerializer, 
    ClienteRetrieveSerializer, 
    ProdutoSerializer, 
    OrcamentoSerializer,
    ItemOrcamentoSerializer, 
    PedidoSerializer, 
    ItemPedidoSerializer, 
    PagamentoSerializer, 
    DespesaConsolidadaSerializer, 
    DespesaSerializer, 
    EmpresaSerializer, 
    UserSerializer, 
    ChangePasswordSerializer, 
    EmpresaPublicaSerializer, 
    RelatorioClienteSerializer,
    RelatorioPedidosAtrasadosSerializer, 
    FormaPagamentoAgrupadoSerializer, 
    StatusOrcamentoAgrupadoSerializer, 
    ProdutosOrcadosAgrupadoSerializer, 
    RelatorioOrcamentoRecenteSerializer, 
    RelatorioProdutoVendidoSerializer,
    RelatorioProdutoLucrativoSerializer, 
    RelatorioProdutoBaixaDemandaSerializer, 
    RelatorioProdutoAlertaEstoqueSerializer, 
    ProfileSerializer,
    ArtePedidoSerializer, 
    PedidoAprovacaoPublicoSerializer, 
    PedidoRejeicaoSerializer, 
    EtiquetaPortariaSerializer, 
    PedidoKanbanSerializer,
    FornecedorSerializer, 
    CustoFornecedorPedidoSerializer,
    RelatorioFornecedorGastoSerializer,
    RelatorioFornecedorUsoSerializer,
    MovimentacaoEstoqueReadSerializer,
    MovimentacaoEstoqueWriteSerializer, 
    ProdutoDetalhadoSerializer,
    ContasAPagarSerializer,
    ContasAReceberSerializer,
    FluxoCaixaSerializer,
    GroupSerializer,
    UserManagementSerializer
)


def get_date_range(request):
    today = timezone.now().date()
    data_inicio_str = request.query_params.get('data_inicio')
    data_fim_str = request.query_params.get('data_fim')
    if data_inicio_str and data_fim_str:
        try:
            data_inicio = datetime.datetime.strptime(data_inicio_str, '%Y-%m-%d').date()
            data_fim = datetime.datetime.strptime(data_fim_str, '%Y-%m-%d').date()
            return data_inicio, data_fim
        except ValueError:
            pass 
    start_of_month = today.replace(day=1)
    return start_of_month, today


class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all().order_by('-data_cadastro')
    serializer_class = ClienteSerializer 
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['nome', 'cpf_cnpj', 'email']
    permission_classes = [CanAccessClientes]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ClienteRetrieveSerializer
        return ClienteSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action == 'retrieve':
            queryset = queryset.prefetch_related('pedidos', 'orcamentos')
        return queryset


class ProdutoViewSet(viewsets.ModelViewSet):
    serializer_class = ProdutoSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['nome']
    permission_classes = [IsAuthenticated] 
    
    def get_queryset(self):
        queryset = Produto.objects.all().order_by('nome')
        tipo = self.request.query_params.get('tipo_precificacao')
        if tipo is not None:
            queryset = queryset.filter(tipo_precificacao=tipo)
        return queryset

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProdutoDetalhadoSerializer
        return ProdutoSerializer


class FornecedorViewSet(viewsets.ModelViewSet):
    queryset = Fornecedor.objects.all().order_by('nome')
    serializer_class = FornecedorSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['nome', 'contato_nome', 'servicos_prestados', 'cnpj'] 
    permission_classes = [CanAccessFinance]

class CustoFornecedorPedidoViewSet(viewsets.ModelViewSet):
    queryset = CustoFornecedorPedido.objects.all()
    serializer_class = CustoFornecedorPedidoSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['pedido', 'fornecedor', 'status'] 
    permission_classes = [CanAccessFinance]

    @action(detail=True, methods=['post'])
    def pagar(self, request, pk=None):
        custo = self.get_object()
        if custo.status == 'PAGO':
            return Response(
                {'error': 'Este custo já foi pago.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        data_pagamento_str = request.data.get('data_pagamento')
        if data_pagamento_str:
            try:
                data_pagamento = datetime.datetime.strptime(data_pagamento_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({'error': 'Formato de data inválido. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            data_pagamento = timezone.now().date() 

        custo.status = 'PAGO'
        custo.data_pagamento = data_pagamento
        custo.save(update_fields=['status', 'data_pagamento'])
        
        serializer = self.get_serializer(custo)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MovimentacaoEstoqueViewSet(viewsets.ModelViewSet):
    queryset = MovimentacaoEstoque.objects.all()
    serializer_class = MovimentacaoEstoqueWriteSerializer 
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['produto']
    permission_classes = [IsAdminOrProducao]

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return MovimentacaoEstoqueReadSerializer
        return MovimentacaoEstoqueWriteSerializer

class OrcamentoViewSet(viewsets.ModelViewSet):
    queryset = Orcamento.objects.all().order_by('-data_criacao')
    serializer_class = OrcamentoSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['cliente__nome', 'id']
    permission_classes = [CanAccessPedidos] 
    
    def get_queryset(self):
        return (
            Orcamento.objects
            .all()
            .order_by('-data_criacao')
            .exclude(status='Aprovado')
        )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("\n❌ ERRO AO CRIAR ORÇAMENTO:")
            print(serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        old_status = instance.status
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            print("\n❌ ERRO AO EDITAR ORÇAMENTO:")
            print(serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_update(serializer)
        new_status = instance.status
        if new_status == 'Aprovado' and old_status != 'Aprovado':
            if not hasattr(instance, 'pedido'):
                try:
                    instance.gerar_pedido()
                except Exception as e:
                    print(f"❌ ERRO AO TENTAR GERAR PEDIDO AUTOMATICAMENTE: {e}")
                    pass
        return Response(serializer.data)
    @action(detail=True, methods=['post'], url_path='converter-para-pedido')
    def converter_para_pedido(self, request, pk=None):
        orcamento = self.get_object()
        if hasattr(orcamento, 'pedido'):
            return Response(
                {'error': 'Este orçamento já foi convertido em um pedido.'},
                status=status.HTTP_409_CONFLICT
            )
        try:
            novo_pedido = orcamento.gerar_pedido()
        except Exception as e:
            print(f"❌ ERRO AO CONVERTER ORÇAMENTO: {e}")
            return Response(
                {'error': 'Falha ao gerar o pedido.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        orcamento.status = 'Aprovado'
        orcamento.save(update_fields=['status'])
        serializer = PedidoSerializer(novo_pedido)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class ItemOrcamentoViewSet(viewsets.ModelViewSet):
    queryset = ItemOrcamento.objects.all()
    serializer_class = ItemOrcamentoSerializer
    permission_classes = [CanAccessPedidos]


class PedidoViewSet(viewsets.ModelViewSet):
    serializer_class = PedidoSerializer
    queryset = Pedido.objects.all().order_by('-data_criacao')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['cliente__nome', 'id']
    permission_classes = [CanAccessPedidos]

class ItemPedidoViewSet(viewsets.ModelViewSet):
    queryset = ItemPedido.objects.all()
    serializer_class = ItemPedidoSerializer
    permission_classes = [CanAccessPedidos]


class ArtePedidoViewSet(viewsets.ModelViewSet):
    queryset = ArtePedido.objects.all()
    serializer_class = ArtePedidoSerializer
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [CanAccessPedidos]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        pedido_id = self.request.query_params.get('pedido_id')
        if pedido_id:
            queryset = queryset.filter(pedido_id=pedido_id)
        return queryset
    def perform_create(self, serializer):
        pedido = serializer.validated_data['pedido']
        serializer.save()
        update_fields = ['status_arte']
        if not pedido.token_aprovacao:
            pedido.token_aprovacao = uuid.uuid4()
            update_fields.append('token_aprovacao')
        pedido.status_arte = Pedido.StatusArte.EM_APROVACAO
        pedido.save(update_fields=update_fields)


class AprovacaoPedidoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Pedido.objects.filter(token_aprovacao__isnull=False)
    serializer_class = PedidoAprovacaoPublicoSerializer
    permission_classes = [AllowAny]
    lookup_field = 'token_aprovacao'
    lookup_url_kwarg = 'token'
    @action(detail=True, methods=['post'])
    def aprovar(self, request, token=None):
        pedido = self.get_object()
        if pedido.status_arte == Pedido.StatusArte.APROVADO:
             return Response({"status": "Pedido já estava aprovado"}, status=status.HTTP_200_OK)
        if pedido.status_arte != Pedido.StatusArte.EM_APROVACAO:
            return Response(
                {"error": "Este pedido não está aguardando aprovação."},
                status=status.HTTP_400_BAD_REQUEST
            )
        pedido.status_arte = Pedido.StatusArte.APROVADO
        pedido.save(update_fields=['status_arte'])
        return Response({"status": "Pedido aprovado com sucesso"}, status=status.HTTP_200_OK)
    @action(detail=True, methods=['post'])
    def rejeitar(self, request, token=None):
        pedido = self.get_object()
        if pedido.status_arte != Pedido.StatusArte.EM_APROVACAO:
            return Response(
                {"error": "Este pedido não pode ser rejeitado no momento."},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = PedidoRejeicaoSerializer(data=request.data)
        if serializer.is_valid():
            comentario = serializer.validated_data['comentarios_cliente']
            latest_arte = pedido.artes.order_by('-data_upload').first()
            if latest_arte:
                latest_arte.comentarios_cliente = comentario
                latest_arte.save(update_fields=['comentarios_cliente'])
            pedido.status_arte = Pedido.StatusArte.REJEITADO
            pedido.save(update_fields=['status_arte'])
            return Response({"status": "Pedido rejeitado com comentários"}, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DespesaViewSet(viewsets.ModelViewSet):
    queryset = Despesa.objects.all().order_by('-data')
    serializer_class = DespesaSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['descricao', 'categoria']
    filterset_fields = ['status', 'categoria'] 
    permission_classes = [CanAccessFinance]

    @action(detail=True, methods=['post'])
    def pagar(self, request, pk=None):
        despesa = self.get_object()
        if despesa.status == 'PAGO':
            return Response(
                {'error': 'Esta despesa já foi paga.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        data_pagamento_str = request.data.get('data_pagamento')
        if data_pagamento_str:
            try:
                data_pagamento = datetime.datetime.strptime(data_pagamento_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({'error': 'Formato de data inválido. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            data_pagamento = timezone.now().date()

        despesa.status = 'PAGO'
        despesa.data_pagamento = data_pagamento
        despesa.save(update_fields=['status', 'data_pagamento'])
        
        serializer = self.get_serializer(despesa)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DespesaConsolidadaView(APIView):
    permission_classes = [CanAccessFinance]
    
    def get(self, request, *args, **kwargs):
        despesas_gerais = Despesa.objects.annotate(tipo=Value('Geral', output_field=CharField())).values('id', 'descricao', 'valor', 'data', 'categoria', 'tipo')
        custos_producao = Pedido.objects.filter(custo_producao__gt=0).annotate(tipo=Value('Produção', output_field=CharField())).values('id', 'custo_producao', 'data_criacao', 'tipo', 'cliente__nome')
        custos_formatados = [{'id': f"p_{custo['id']}", 'descricao': f"Custo do Pedido #{custo['id']} ({custo['cliente__nome']})", 'valor': custo['custo_producao'], 'data': custo['data_criacao'].date(), 'categoria': 'Custo de Produção', 'tipo': custo['tipo']} for custo in custos_producao]
        lista_combinada = sorted(list(despesas_gerais) + custos_formatados, key=lambda x: x['data'], reverse=True)
        serializer = DespesaConsolidadaSerializer(lista_combinada, many=True)
        return Response(serializer.data)


class ContasAPagarView(APIView):
    permission_classes = [CanAccessFinance]
    
    def get(self, request, *args, **kwargs):
        despesas_a_pagar = Despesa.objects.filter(status='A PAGAR')
        custos_a_pagar = CustoFornecedorPedido.objects.filter(status='A PAGAR') \
                                                    .select_related('fornecedor', 'pedido')
        lista_formatada = []
        
        for d in despesas_a_pagar:
            lista_formatada.append({
                'id': f"d_{d.id}",
                'tipo': 'Despesa Geral',
                'descricao': f"{d.descricao} ({d.categoria or 'Sem categoria'})",
                'valor': d.valor,
                'data_vencimento': d.data, 
                'status': d.status,
                'endpoint_type': 'despesas-gerais',
                'original_id': d.id
            })
            
        for c in custos_a_pagar:
            lista_formatada.append({
                'id': f"c_{c.id}",
                'tipo': 'Custo de Produção',
                'descricao': f"{c.descricao} (Fornecedor: {c.fornecedor.nome}) - Pedido #{c.pedido.id}",
                'valor': c.custo,
                'data_vencimento': c.data_vencimento or c.data_criacao.date(), 
                'status': c.status,
                'endpoint_type': 'custos-pedido',
                'original_id': c.id
            })

        lista_ordenada = sorted(lista_formatada, key=lambda x: x['data_vencimento'])
        
        serializer = ContasAPagarSerializer(lista_ordenada, many=True)
        return Response(serializer.data)


class DashboardStatsView(APIView):
    permission_classes = [CanAccessFinance]
    
    def get(self, request, *args, **kwargs):
        data_inicio, data_fim = get_date_range(request)

        pagamentos_recebidos = Pagamento.objects.filter(
            data__date__range=[data_inicio, data_fim]
        )
        faturamento = pagamentos_recebidos.aggregate(total=Sum('valor'))['total'] or 0
        
        despesas_operacionais_pagas = Despesa.objects.filter(
            status='PAGO',
            data_pagamento__range=[data_inicio, data_fim]
        )
        despesas_operacionais = despesas_operacionais_pagas.aggregate(total=Sum('valor'))['total'] or 0
        
        custos_producao_pagos = CustoFornecedorPedido.objects.filter(
            status='PAGO',
            data_pagamento__range=[data_inicio, data_fim]
        )
        custo_producao_pedidos = custos_producao_pagos.aggregate(total=Sum('custo'))['total'] or 0
        
        despesas_totais = despesas_operacionais + custo_producao_pedidos
        lucro = faturamento - despesas_totais
        
        pedidos_nao_quitados = Pedido.objects.filter(
            Q(status_pagamento='PENDENTE') | Q(status_pagamento='PARCIAL')
        )
        
        total_devido = 0
        total_pago_parcialmente = 0

        for pedido in pedidos_nao_quitados:
            total_devido += pedido.valor_total
            total_pago_parcialmente += pedido.pagamentos.aggregate(total=Sum('valor'))['total'] or 0
            
        a_receber = total_devido - total_pago_parcialmente
        
        data = {
            'faturamento': faturamento, 
            'despesas': despesas_totais, 
            'lucro': lucro, 
            'valor_a_receber': a_receber
        }
        return Response(data)
    
class PagamentoViewSet(viewsets.ModelViewSet):
    queryset = Pagamento.objects.all()
    serializer_class = PagamentoSerializer
    permission_classes = [CanAccessFinance]
    
    def perform_create(self, serializer):
        pagamento = serializer.save()
        pedido = pagamento.pedido
        total_pago = pedido.pagamentos.aggregate(total=Sum('valor'))['total'] or 0
        if total_pago >= pedido.valor_total:
            pedido.status_pagamento = Pedido.StatusPagamento.PAGO
        else:
            pedido.status_pagamento = Pedido.StatusPagamento.PARCIAL
        pedido.save()


class VendasRecentesView(APIView):
    permission_classes = [CanAccessPedidos]
    
    def get(self, request, *args, **kwargs):
        ultimos_pedidos = Pedido.objects.all().order_by('-data_criacao')[:5]
        serializer = PedidoSerializer(ultimos_pedidos, many=True)
        return Response(serializer.data)
    

class FaturamentoPorPagamentoView(APIView):
    permission_classes = [CanAccessFinance]
    
    def get(self, request, *args, **kwargs):
        data_inicio, data_fim = get_date_range(request)
        
        faturamento_agrupado = Pagamento.objects.filter(
            data__date__range=[data_inicio, data_fim]
        ).values('forma_pagamento').annotate(
            total=Sum('valor')
        ).order_by('-total')
        
        return Response(faturamento_agrupado)
    

class ContasAReceberView(APIView):
    permission_classes = [CanAccessFinance]

    def get(self, request, *args, **kwargs):
        pedidos_a_receber = Pedido.objects.filter(
            status_pagamento__in=[Pedido.StatusPagamento.PENDENTE, Pedido.StatusPagamento.PARCIAL]
        ).select_related('cliente').prefetch_related('pagamentos').order_by('data_criacao')
        
        serializer = ContasAReceberSerializer(pedidos_a_receber, many=True)
        return Response(serializer.data)


class FluxoCaixaView(APIView):
    permission_classes = [CanAccessFinance]

    def get(self, request, *args, **kwargs):
        data_inicio, data_fim = get_date_range(request)

        inflows = Pagamento.objects.filter(
            data__date__range=[data_inicio, data_fim]
        ).annotate(
            day=TruncDay('data')
        ).values('day').annotate(
            total=Sum('valor')
        ).order_by('day')

        outflows_despesas = Despesa.objects.filter(
            status='PAGO',
            data_pagamento__range=[data_inicio, data_fim]
        ).values('data_pagamento').annotate(
            total=Sum('valor')
        ).order_by('data_pagamento')
        
        outflows_custos = CustoFornecedorPedido.objects.filter(
            status='PAGO',
            data_pagamento__range=[data_inicio, data_fim]
        ).values('data_pagamento').annotate(
            total=Sum('custo')
        ).order_by('data_pagamento')

        data_map = defaultdict(lambda: {'inflows': Decimal(0), 'outflows': Decimal(0)})
        all_dates = set()

        for item in inflows:
            date = item['day'].date()
            data_map[date]['inflows'] += item['total'] or 0
            all_dates.add(date)

        for item in outflows_despesas:
            date = item['data_pagamento']
            data_map[date]['outflows'] += item['total'] or 0
            all_dates.add(date)
            
        for item in outflows_custos:
            date = item['data_pagamento']
            data_map[date]['outflows'] += item['total'] or 0
            all_dates.add(date)

        sorted_dates = sorted(list(all_dates))
        final_data = []
        for date in sorted_dates:
            final_data.append({
                'date': date,
                'inflows': data_map[date]['inflows'],
                'outflows': data_map[date]['outflows']
            })

        serializer = FluxoCaixaSerializer(final_data, many=True)
        return Response(serializer.data)


class RelatorioFaturamentoView(APIView):
    permission_classes = [CanAccessReports]
    
    def get(self, request, *args, **kwargs):
        data_inicio_str = request.query_params.get('data_inicio')
        data_fim_str = request.query_params.get('data_fim')
        if not data_inicio_str or not data_fim_str:
            return Response(
                {'error': 'As datas de início e fim são obrigatórias.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        data_inicio = datetime.datetime.strptime(data_inicio_str, '%Y-%m-%d').date()
        data_fim = datetime.datetime.strptime(data_fim_str, '%Y-%m-%d').date()
        pedidos = Pedido.objects.filter(
            data_criacao__date__range=[data_inicio, data_fim],
            status_pagamento='PAGO'
        ).order_by('data_criacao')
        total_faturado = pedidos.aggregate(total=Sum('valor_total'))['total'] or 0
        context = {
            'pedidos': pedidos,
            'total_faturado': total_faturado,
            'data_inicio': data_inicio.strftime('%d/%m/%Y'),
            'data_fim': data_fim.strftime('%d/%m/%Y'),
        }
        html_string = render_to_string('relatorios/faturamento.html', context)
        pdf = HTML(string=html_string).write_pdf()
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="relatorio_faturamento_{data_inicio_str}_a_{data_fim_str}.pdf"'
        return response
    

class OrcamentoPDFView(APIView):
    permission_classes = [CanAccessPedidos]
    
    def get(self, request, pk, *args, **kwargs):
        orcamento = get_object_or_404(Orcamento, pk=pk)
        empresa = Empresa.objects.first()
        logo_url = None
        if empresa and empresa.logo_orcamento_pdf:
            logo_url = request.build_absolute_uri(empresa.logo_orcamento_pdf.url)
        itens = orcamento.itens.all()
        for item in itens:
            if item.quantidade > 0:
                item.valor_unitario = item.subtotal / item.quantidade
            else:
                item.valor_unitario = 0
        context = {
            'orcamento': orcamento,
            'itens': itens,
            'empresa': empresa,
            'logo_url': logo_url
        }
        html_string = render_to_string('documentos/orcamento_pdf.html', context)
        pdf = HTML(string=html_string).write_pdf()
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="orcamento_{pk}.pdf"'
        return response

class PedidoPDFView(APIView):
    permission_classes = [CanAccessPedidos]
    
    def get(self, request, pk, *args, **kwargs):
        pedido = get_object_or_404(Pedido, pk=pk)
        empresa = Empresa.objects.first()
        logo_url = None
        if empresa and empresa.logo_orcamento_pdf:
            logo_url = request.build_absolute_uri(empresa.logo_orcamento_pdf.url)
        itens = pedido.itens.all()
        for item in itens:
            if item.quantidade > 0:
                item.valor_unitario = item.subtotal / item.quantidade
            else:
                item.valor_unitario = 0

        is_paid = pedido.status_pagamento == 'PAGO' 

        context = {
            'pedido': pedido,
            'itens': itens,
            'empresa': empresa,
            'logo_url': logo_url,
            'is_paid': is_paid, 
        }
        html_string = render_to_string('documentos/pedido_os_pdf.html', context)
        pdf = HTML(string=html_string).write_pdf()
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="pedido_os_{pk}.pdf"'
        return response


class PedidoProducaoPDFView(APIView):
    permission_classes = [CanAccessKanban]
    
    def get(self, request, pk, *args, **kwargs):
        pedido = get_object_or_404(Pedido, pk=pk)
        empresa = Empresa.objects.first()
        logo_url = None
        if empresa and empresa.logo_orcamento_pdf:
            logo_url = request.build_absolute_uri(empresa.logo_orcamento_pdf.url)
        
        arte_url = None
        if pedido.status_arte == Pedido.StatusArte.APROVADO:
            arte = pedido.artes.order_by('-data_upload').first()
            if arte and arte.layout:
                arte_url = request.build_absolute_uri(arte.layout.url)
        
        context = {
            'pedido': pedido,
            'itens': pedido.itens.all(),
            'empresa': empresa,
            'logo_url': logo_url,
            'arte_url': arte_url, 
        }
        
        html_string = render_to_string('documentos/pedido_os_producao.html', context)
        
        pdf = HTML(string=html_string).write_pdf()
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="os_producao_{pk}.pdf"'
        return response


class EmpresaSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """
        GET: Todos os usuários logados (para ver a logo).
        PUT: Apenas Admins (para salvar as configurações).
        """
        if self.request.method == 'PUT':
            self.permission_classes = [IsAdmin]
        else:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

    def get(self, request, *args, **kwargs):
        empresa, created = Empresa.objects.get_or_create(pk=1)
        serializer = EmpresaSerializer(empresa)
        return Response(serializer.data)
    
    def put(self, request, *args, **kwargs):
        empresa, created = Empresa.objects.get_or_create(pk=1)
        serializer = EmpresaSerializer(empresa, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    def get(self, request, *args, **kwargs):
        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data)
    def put(self, request, *args, **kwargs):
        user = request.user
        user_serializer = UserSerializer(user, data=request.data, partial=True, context={'request': request})
        if not user_serializer.is_valid():
            return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        user_serializer.save()
        if 'profile_pic' in request.FILES:
            profile = user.profile
            profile_data = {'profile_pic': request.FILES['profile_pic']}
            profile_serializer = ProfileSerializer(profile, data=profile_data, partial=True)
            if profile_serializer.is_valid():
                profile_serializer.save()
            else:
                return Response(profile_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response(UserSerializer(user, context={'request': request}).data)

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, *args, **kwargs):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            old_password = serializer.validated_data['old_password']
            new_password = serializer.validated_data['new_password']
            if not user.check_password(old_password):
                return Response({"old_password": ["Senha antiga está incorreta."]}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(new_password)
            user.save()
            return Response({"status": "senha alterada com sucesso"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class EmpresaPublicaView(APIView):
    permission_classes = [AllowAny]
    def get(self, request, *args, **kwargs):
        empresa, created = Empresa.objects.get_or_create(pk=1)
        serializer = EmpresaPublicaSerializer(empresa)
        return Response(serializer.data)
    

class ConsultaCNPJView(APIView):
    permission_classes = [IsAuthenticated] 

    def get(self, request, cnpj, *args, **kwargs):
        cnpj_limpo = re.sub(r'\D', '', cnpj)
        if len(cnpj_limpo) != 14:
            return Response(
                {"error": "CNPJ deve conter 14 dígitos."},
                status=status.HTTP_400_BAD_REQUEST
            )
        url = f"https://brasilapi.com.br/api/cnpj/v1/{cnpj_limpo}"
        try:
            response = requests.get(url, timeout=5) 
            if response.status_code == 200:
                return Response(response.json(), status=status.HTTP_200_OK)
            elif response.status_code == 404:
                return Response(
                    {"error": "CNPJ não encontrado na base de dados da Receita Federal."},
                    status=status.HTTP_404_NOT_FOUND
                )
            else:
                return Response(
                    {"error": "Erro ao consultar a API externa."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        except requests.exceptions.Timeout:
            return Response(
                {"error": "A consulta ao CNPJ demorou muito (timeout)."},
                status=status.HTTP_408_REQUEST_TIMEOUT
            )
        except requests.exceptions.RequestException as e:
            return Response(
                {"error": f"Erro de conexão ao consultar CNPJ: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserManagementViewSet(viewsets.ModelViewSet):
    """
    Endpoint para Admins gerenciarem usuários (funcionários).
    """
    queryset = User.objects.filter(is_superuser=False).prefetch_related('groups').order_by('username')
    serializer_class = UserManagementSerializer
    permission_classes = [IsAdmin]

class GroupsView(APIView):
    """
    Endpoint para Admins verem os cargos (grupos) disponíveis.
    """
    permission_classes = [IsAdmin]

    def get(self, request, *args, **kwargs):
        grupos = Group.objects.all().order_by('name')
        serializer = GroupSerializer(grupos, many=True)
        return Response(serializer.data)


class EvolucaoVendasView(APIView):
    permission_classes = [CanAccessReports]
    def get(self, request, *args, **kwargs):
        seis_meses_atras = now().date().replace(day=1) - datetime.timedelta(days=30*5)
        vendas = Pedido.objects.filter(
            data_criacao__gte=seis_meses_atras,
            status_pagamento='PAGO'
        ).annotate(
            mes=TruncMonth('data_criacao')
        ).values('mes').annotate(
            total=Sum('valor_total')
        ).order_by('mes')
        data_formatada = [
            {"name": item['mes'].strftime('%b/%y'), "Receita": item['total']}
            for item in vendas
        ]
        return Response(data_formatada)

class PedidosPorStatusView(APIView):
    permission_classes = [CanAccessReports]
    def get(self, request, *args, **kwargs):
        status_counts = Pedido.objects.values('status_producao').annotate(
            value=Count('id')
        ).order_by('-value')
        data_formatada = [
            {"name": item['status_producao'], "value": item['value']}
            for item in status_counts
        ]
        return Response(data_formatada)
    

class ProdutosMaisVendidosView(APIView):
    permission_classes = [CanAccessReports]
    def get(self, request, *args, **kwargs):
        today = datetime.date.today()
        start_of_month = today.replace(day=1)
        produtos = ItemPedido.objects.filter(pedido__data_criacao__gte=start_of_month)\
            .values('produto__nome')\
            .annotate(total_vendido=Sum('quantidade'))\
            .order_by('-total_vendido')[:5]
        data_formatada = [
            {"name": item['produto__nome'], "value": item['total_vendido']}
            for item in produtos
        ]
        return Response(data_formatada)

class ClientesMaisAtivosView(APIView):
    permission_classes = [CanAccessReports]
    def get(self, request, *args, **kwargs):
        clientes = Pedido.objects.values('cliente__nome')\
            .annotate(
                total_gasto=Sum('valor_total'),
                total_pedidos=Count('id')
            )\
            .order_by('-total_gasto')[:5]
        data_formatada = [
            {
                "name": item['cliente__nome'],
                "total_pedidos": item['total_pedidos'],
                "total_gasto": item['total_gasto']
            }
            for item in clientes
        ]
        return Response(data_formatada)
    

class RelatorioClientesView(APIView):
    permission_classes = [CanAccessReports]
    def get(self, request, *args, **kwargs):
        hoje = timezone.now().date()
        data_30_dias_atras = hoje - datetime.timedelta(days=30)
        data_90_dias_atras = hoje - datetime.timedelta(days=90)
        total_clientes = Cliente.objects.count()
        novos_clientes_30d = Cliente.objects.filter(data_cadastro__gte=data_30_dias_atras).count()
        clientes_ativos_ids = Pedido.objects.filter(
            data_criacao__gte=data_90_dias_atras
        ).values_list('cliente_id', flat=True).distinct()
        clientes_ativos_90d = len(clientes_ativos_ids)
        clientes_inativos = Cliente.objects.exclude(id__in=clientes_ativos_ids).annotate(
            total_gasto=Coalesce(Sum('pedidos__valor_total'), 0.0, output_field=DecimalField()),
            ultimo_pedido=Max('pedidos__data_criacao__date'),
            dias_inativo=ExpressionWrapper(
                hoje - F('ultimo_pedido'),
                output_field=fields.IntegerField()
            )
        ).order_by('-total_gasto')
        inativos_serializer = RelatorioClienteSerializer(clientes_inativos, many=True)
        data = {
            'total_clientes': total_clientes,
            'novos_clientes_30d': novos_clientes_30d,
            'clientes_ativos_90d': clientes_ativos_90d,
            'clientes_inativos_90d': clientes_inativos.count(),
            'lista_inativos': inativos_serializer.data
        }
        return Response(data)
    

class RelatorioPedidosView(APIView):
    permission_classes = [CanAccessReports]
    def get(self, request, *args, **kwargs):
        hoje = timezone.now().date()
        total_pedidos = Pedido.objects.count()
        pedidos_atrasados_query = Pedido.objects.filter(
            previsto_entrega__lt=hoje,
            status_producao__in=['Aguardando', 'Aguardando Arte', 'Em Produção']
        ).annotate(
            dias_atraso=ExpressionWrapper(
                hoje - F('previsto_entrega'),
                output_field=fields.DurationField()
            )
        )
        pedidos_atrasados_count = pedidos_atrasados_query.count()
        lista_atrasados = RelatorioPedidosAtrasadosSerializer(pedidos_atrasados_query, many=True).data
        lucro_medio = Pedido.objects.filter(status_pagamento='PAGO').aggregate(
            lucro_avg=Avg(F('valor_total') - F('custo_producao'))
        )['lucro_avg'] or 0
        pedidos_finalizados = Pedido.objects.filter(status_producao='Finalizado')
        tempo_medio = pedidos_finalizados.annotate(
            tempo_producao=ExpressionWrapper(F('data_producao') - F('data_criacao'), output_field=fields.DurationField())
        ).aggregate(
            avg_tempo=Avg('tempo_producao')
        )['avg_tempo']
        pedidos_por_pagamento = Pagamento.objects.values('forma_pagamento').annotate(
            value=Count('id')
        ).order_by('-value')
        pedidos_por_pagamento_data = FormaPagamentoAgrupadoSerializer(pedidos_por_pagamento, many=True).data
        data = {
            'total_pedidos': total_pedidos,
            'pedidos_atrasados_count': pedidos_atrasados_count,
            'lucro_medio_pedido': lucro_medio,
            'tempo_medio_producao_dias': tempo_medio.days if tempo_medio else 0,
            'lista_pedidos_atrasados': lista_atrasados,
            'pedidos_por_forma_pagamento': pedidos_por_pagamento_data,
        }
        return Response(data)


class RelatorioOrcamentosView(APIView):
    permission_classes = [CanAccessReports]
    def get(self, request, *args, **kwargs):
        orcamentos = Orcamento.objects.all()
        total_orcamentos = orcamentos.count()
        aprovados = orcamentos.filter(status='Aprovado').count()
        recusados = orcamentos.filter(status='Rejeitado').count()
        pendentes = orcamentos.filter(status='Em Aberto').count()
        taxa_conversao = (aprovados / total_orcamentos * 100) if total_orcamentos > 0 else 0
        valor_total_orcado = orcamentos.aggregate(total=Sum('valor_total'))['total'] or 0
        valor_total_aprovado = orcamentos.filter(status='Aprovado').aggregate(total=Sum('valor_total'))['total'] or 0
        status_data = orcamentos.values('status').annotate(value=Count('id'))
        status_serializer = StatusOrcamentoAgrupadoSerializer(status_data, many=True)
        produtos_data = ItemOrcamento.objects.values('produto__nome').annotate(value=Count('id')).order_by('-value')[:5]
        produtos_serializer = ProdutosOrcadosAgrupadoSerializer(produtos_data, many=True)
        recentes_data = orcamentos.order_by('-data_criacao')[:6]
        recentes_serializer = RelatorioOrcamentoRecenteSerializer(recentes_data, many=True)
        data = {
            'cards': {
                'total_orcamentos': total_orcamentos,
                'taxa_conversao': taxa_conversao,
                'tempo_medio_resposta': "1.8 dias",
                'valor_total_orcado': valor_total_orcado,
                'valor_total_aprovado': valor_total_aprovado,
                'aprovados_count': aprovados,
                'recusados_count': recusados,
            },
            'grafico_status': status_serializer.data,
            'grafico_produtos': produtos_serializer.data,
            'tabela_recentes': recentes_serializer.data,
        }
        return Response(data)
    

class RelatorioProdutosView(APIView):
    permission_classes = [CanAccessReports]
    def get(self, request, *args, **kwargs):
        hoje = timezone.now().date()
        data_60_dias_atras = hoje - datetime.timedelta(days=60)
        start_of_month = hoje.replace(day=1)
        agregados_produto = Produto.objects.aggregate(
            total_produtos=Count('id'),
            custo_medio=Avg('custo'),
            preco_medio=Avg('preco')
        )
        alertas_estoque_query = Produto.objects.filter(
            estoque_atual__isnull=False, 
            estoque_minimo__gt=0, 
            estoque_atual__lt=F('estoque_minimo')
        ).order_by('estoque_atual')
        alertas_estoque_serializer = RelatorioProdutoAlertaEstoqueSerializer(alertas_estoque_query, many=True)
        cards_data = {
            "total_produtos": agregados_produto['total_produtos'] or 0,
            "custo_medio": agregados_produto['custo_medio'] or 0,
            "preco_medio_venda": agregados_produto['preco_medio'] or 0,
            "alertas_estoque": alertas_estoque_query.count(),
        }
        produtos_vendidos = ItemPedido.objects.filter(pedido__data_criacao__gte=start_of_month)\
            .values('produto__nome')\
            .annotate(total_vendido=Sum('quantidade'))\
            .order_by('-total_vendido')[:5]
        grafico_vendidos_serializer = RelatorioProdutoVendidoSerializer(produtos_vendidos, many=True)
        produtos_lucrativos = ItemPedido.objects.filter(produto__custo__gt=0, produto__preco__gt=0)\
            .values('produto__nome')\
            .annotate(
                total_lucro=Sum(F('subtotal') - (F('produto__custo') * F('quantidade'))),
                receita_total=Sum('subtotal'),
                custo_total=Sum(F('produto__custo') * F('quantidade'))
            )\
            .annotate(
                margem=Case(
                    When(receita_total=0, then=Value(0.0, output_field=DecimalField())),
                    default=ExpressionWrapper(
                        (F('receita_total') - F('custo_total')) * 100.0 / F('receita_total'),
                        output_field=DecimalField()
                    )
                )
            )\
            .order_by('-total_lucro')[:6]
        lucrativos_serializer = RelatorioProdutoLucrativoSerializer(produtos_lucrativos, many=True)
        produtos_baixa_demanda = Produto.objects.annotate(
            ultima_venda=Max('itempedido__pedido__data_criacao__date')
        ).filter(
            Q(ultima_venda__lt=data_60_dias_atras) | Q(ultima_venda__isnull=True)
        ).annotate(
            dias_sem_venda=ExpressionWrapper(
                hoje - F('ultima_venda'),
                output_field=fields.DurationField()
            )
        ).order_by('ultima_venda')[:6]
        baixa_demanda_serializer = RelatorioProdutoBaixaDemandaSerializer(produtos_baixa_demanda, many=True)
        data = {
            'cards': cards_data,
            'grafico_mais_vendidos': grafico_vendidos_serializer.data,
            'lista_mais_lucrativos': lucrativos_serializer.data,
            'tabela_baixa_demanda': baixa_demanda_serializer.data,
            'lista_alertas_estoque': alertas_estoque_serializer.data,
        }
        return Response(data)
    

class RelatorioFornecedoresView(APIView):
    permission_classes = [CanAccessReports]
    def get(self, request, *args, **kwargs):
        mais_gastos = CustoFornecedorPedido.objects.values(
            'fornecedor__nome'
        ).annotate(
            total_gasto=Sum('custo')
        ).order_by('-total_gasto')[:10]
        
        mais_usados = CustoFornecedorPedido.objects.values(
            'fornecedor__nome'
        ).annotate(
            total_pedidos=Count('id')
        ).order_by('-total_pedidos')[:10]
        
        gastos_serializer = RelatorioFornecedorGastoSerializer(mais_gastos, many=True)
        usados_serializer = RelatorioFornecedorUsoSerializer(mais_usados, many=True)
        
        data = {
            'grafico_mais_gastos': gastos_serializer.data,
            'grafico_mais_usados': usados_serializer.data,
        }
        return Response(data)


class EtiquetaPortariaViewSet(viewsets.ModelViewSet):
    queryset = EtiquetaPortaria.objects.all()
    serializer_class = EtiquetaPortariaSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['nome_responsavel', 'bloco', 'apartamento']
    permission_classes = [IsAuthenticated]


class EtiquetaPDFView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, pk, *args, **kwargs):
        etiqueta = get_object_or_404(EtiquetaPortaria, pk=pk)
        empresa = Empresa.objects.first()
        logo_url = None
        if empresa and empresa.logo_orcamento_pdf:
            logo_url = request.build_absolute_uri(empresa.logo_orcamento_pdf.url)
        context = {
            'etiqueta': etiqueta,
            'empresa': empresa,
            'logo_url': logo_url
        }
        html_string = render_to_string('documentos/etiqueta_a6.html', context)
        pdf = HTML(string=html_string).write_pdf()
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="etiqueta_{pk}.pdf"'
        return response
    

class PedidosKanbanView(APIView):
    permission_classes = [CanAccessKanban]
    STATUS_COLUNAS = [
        "Aguardando",
        "Aguardando Arte",
        "Em Produção",
        "Finalizado",
    ]
    def get(self, request, *args, **kwargs):
        resposta_agrupada = {status: [] for status in self.STATUS_COLUNAS}
        pedidos = Pedido.objects.filter(
            status_producao__in=self.STATUS_COLUNAS
        ).select_related('cliente').order_by('data_criacao')
        serializer = PedidoKanbanSerializer(pedidos, many=True)
        for pedido_data in serializer.data:
            status = pedido_data['status_producao']
            if status in resposta_agrupada:
                resposta_agrupada[status].append(pedido_data)
        return Response(resposta_agrupada)