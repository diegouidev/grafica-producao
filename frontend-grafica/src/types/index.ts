<<<<<<< HEAD
// diegouidev/frontend-grafica/frontend-grafica-080ad4b051662133bb2b61b52b32403642254d24/src/types/index.ts
=======
// diegouidev/frontend-grafica/frontend-grafica-270119dcf7339df6259b7076295584b294fd424b/src/types/index.ts
>>>>>>> 080ad4b051662133bb2b61b52b32403642254d24
// (Arquivo Modificado)

// Ele descreve a estrutura de uma resposta paginada da nossa API
export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

<<<<<<< HEAD
// --- NOVOS TIPOS DE GERENCIAMENTO ---

// Representa um Cargo (Grupo do Django)
export type Group = {
  id: number;
  name: string;
};

// Representa um Usuário (Funcionário) como visto pelo Admin
export type UserManagement = {
  id: number;
  username: string; // Este é o email de login
  email: string;
  first_name: string;
  last_name: string;
  grupos: string[]; // Lista de nomes dos cargos (ex: ["Admin", "Financeiro"])
};

// Interface para o formulário do modal (inclui a senha opcional)
export type UserFormData = {
  id?: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password?: string; // Senha só é enviada ao criar ou alterar
  grupos: string[];
};
// --- FIM DOS NOVOS TIPOS ---


=======
>>>>>>> 080ad4b051662133bb2b61b52b32403642254d24
// --- NOVO TIPO: PedidoHistory ---
// Baseado no PedidoHistorySerializer
export type PedidoHistory = {
  id: number;
  data_criacao: string;
  valor_total: string;
  status_producao: string;
};

// --- NOVO TIPO: OrcamentoHistory ---
// Baseado no OrcamentoHistorySerializer
export type OrcamentoHistory = {
  id: number;
  data_criacao: string;
  valor_total: string;
  status: string;
};


// --- NOVO TIPO: MovimentacaoEstoque ---
// Baseado no MovimentacaoEstoqueReadSerializer do backend
export type MovimentacaoEstoque = {
  id: number;
  quantidade: number;
  tipo: string; // 'ENTRADA_COMPRA', 'SAIDA_AJUSTE', etc.
  tipo_display: string; // "Entrada (Compra)", "Saída (Ajuste Manual/Perda)"
  observacao: string | null;
  data: string; // Data como string ISO
};

// --- Cliente (ATUALIZADO) ---
export type Cliente = {
    id: number;
    nome: string;
    email?: string | null;
    telefone: string | null;
    cpf_cnpj?: string | null;
    observacao?: string | null; // O '?' torna o campo opcional
    cep?: string | null;
    endereco?: string | null;
    numero?: string | null;
    bairro?: string | null;
    complemento?: string | null;
    cidade?: string | null;
    estado?: string | null;

    // --- CAMPOS ADICIONADOS (Opcionais) ---
    // Virão apenas do ClienteRetrieveSerializer
    pedidos?: PedidoHistory[];
    orcamentos?: OrcamentoHistory[];
  };
  
  // Definição completa para o tipo Produto
  export type Produto = {
    id: number;
    nome: string;
    tipo_precificacao: 'UNICO' | 'M2';
    preco: string;
    custo: string;
    estoque_atual: number | null;
    estoque_minimo: number | null;

    // --- CAMPO ADICIONADO ---
    // Será preenchido ao buscar o detalhe do produto
    movimentacoes?: MovimentacaoEstoque[]; 
};

// --- NOVO TIPO: Fornecedor ---
export type Fornecedor = {
  id: number;
  nome: string;
  cnpj?: string | null;
  contato_nome?: string | null;
  telefone?: string | null;
  email?: string | null;
  servicos_prestados?: string | null;
  data_cadastro: string;
};

// --- CustoFornecedorPedido (ATUALIZADO) ---
export type CustoFornecedorPedido = {
  id: number;
  pedido: number;
  fornecedor: number;
  fornecedor_nome: string;
  descricao: string;
  custo: string;
  // --- CAMPOS ADICIONADOS ---
  status: 'A PAGAR' | 'PAGO';
  data_vencimento: string | null;
  data_pagamento: string | null;
};


export type ItemOrcamento = {
  id: number;
  produto: Produto; // Reutilizamos o tipo Produto
  quantidade: number;
  largura: string | null;
  altura: string | null;
  subtotal: string;
  nome_exibido: string;
};
  
export type Orcamento = {
  id: number;
  cliente: {
    id: number;
    nome: string;
  };
  data_criacao: string;
  valor_total: string;
  status: string;
  itens: ItemOrcamento[];
  valor_frete: string;
  valor_desconto: string;
  data_validade: string | null;

};

export type ArtePedido = {
  id: number;
  layout: string; // Isto será uma URL para a imagem
  comentarios_admin: string | null;
  comentarios_cliente: string | null;
  data_upload: string;
};

  export type Pedido = {
    id: number;
    cliente: { id: number; nome: string; };
    data_criacao: string;
    valor_total: string;
    status_producao: string; // Ex: 'Aguardando', 'Em Produção', 'Finalizado'
    status_pagamento: string; // Ex: 'PENDENTE', 'PARCIAL', 'PAGO'
    status_arte: string; 
    artes: ArtePedido[]; 
    token_aprovacao: string | null;
    previsto_entrega: string | null;
    
    // --- CAMPO ATUALIZADO (AGORA É DE LEITURA) ---
    custo_producao: string | null; 
    
    data_producao: string | null;
    forma_envio: string | null;
    codigo_rastreio: string | null;
    
    // --- CAMPO REMOVIDO ---
    // link_fornecedor: string | null; // REMOVIDO
    
    // --- CAMPO ADICIONADO ---
    custos_fornecedores: CustoFornecedorPedido[];
    
    // Campos de SerializerMethodField (calculados)
    pagamentos: Pagamento[];
    valor_pago: string;
    valor_a_receber: string;

    // --- ADICIONADO PARA OS ITENS (QUANDO O PEDIDO É CARREGADO COMPLETO) ---
    itens?: ItemPedido[];
};


export type ItemPedido = {
  id: number;
  produto: { id: number; nome: string; };
  quantidade: number;
  subtotal: string;
  descricao_customizada: string | null;
  nome_exibido: string; // Adicionado
  
  // --- CAMPO ADICIONADO PELA NOVA FEATURE ---
  observacoes_producao: string | null;
};

// --- NOVOS TIPOS PARA A PÁGINA PÚBLICA ---

export type ItemPedidoPublic = {
  id: number;
  quantidade: number;
  nome_exibido: string;
  subtotal: string;
};

export type PedidoPublico = {
  id: number;
  cliente_nome: string;
  status_arte: string;
  itens: ItemPedidoPublic[];
  artes: ArtePedido[];
  valor_total: string;
};
// ------------------------------------------

// --- Despesa (ATUALIZADO) ---
export type Despesa = {
  id: number;
  descricao: string;
  valor: string; // Vem como string da API
  data: string; // Esta é a DATA DE VENCIMENTO
  categoria: string | null;
  // --- CAMPOS ADICIONADOS ---
  status: 'A PAGAR' | 'PAGO';
  data_pagamento: string | null;
};


// --- NOVO TIPO: ContaAPagar (Consolidado) ---
export type ContaAPagar = {
  id: string; // Ex: "d_1" ou "c_1"
  tipo: string; // Ex: "Despesa Geral"
  descricao: string;
  valor: string;
  data_vencimento: string;
  status: 'A PAGAR' | 'PAGO';
  endpoint_type: 'despesas-gerais' | 'custos-pedido';
  original_id: number;
};

// --- NOVO TIPO: ContasAReceber ---
export type ContasAReceber = {
  id: number; // ID do Pedido
  cliente_nome: string;
  data_criacao: string;
  status_pagamento: 'PENDENTE' | 'PARCIAL';
  valor_total: string;
  valor_pago: string;
  valor_a_receber: string;
};

// --- NOVO TIPO: FluxoCaixaData ---
export type FluxoCaixaData = {
  date: string; // "YYYY-MM-DD"
  inflows: number; // Entradas
  outflows: number; // Saídas
};


export type EtiquetaPortaria = {
  id: number;
  tipo_cliente: 'CONDOMINIO' | 'RETIRADA';
  nome_responsavel: string;
  data_criacao: string;
  bloco?: string | null;
  apartamento?: string | null;
};


export type PedidoKanban = {
  id: number;
  cliente_nome: string;
  valor_formatado: string;
  previsto_entrega_formatado: string | null;
  status_producao: string;
};

// --- NOVOS TIPOS PARA RELATÓRIO DE FORNECEDORES ---
export type RelatorioFornecedorGasto = {
  name: string;
  total_gasto: number;
}

export type RelatorioFornecedorUso = {
  name: string;
  total_pedidos: number;
}