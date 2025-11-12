from rest_framework.permissions import BasePermission, IsAuthenticated

def _is_in_group(user, group_name):
    """
    Verifica se um usuário pertence a um grupo específico.
    """
    if user.is_superuser:
        return True
    return user.groups.filter(name=group_name).exists()

def _is_in_groups(user, group_names):
    """
    Verifica se um usuário pertence a qualquer um dos grupos na lista.
    """
    if user.is_superuser:
        return True
    return user.groups.filter(name__in=group_names).exists()


# --- Permissões de Cargos ---

class IsAdmin(BasePermission):
    """
    Permissão para Superusuários ou membros do grupo 'Admin'.
    """
    def has_permission(self, request, view):
        return _is_in_group(request.user, "Admin")

class IsAdminOrFinanceiro(BasePermission):
    """
    Permissão para 'Admin' ou 'Financeiro'.
    """
    def has_permission(self, request, view):
        return _is_in_groups(request.user, ["Admin", "Financeiro"])

class IsAdminOrAtendimento(BasePermission):
    """
    Permissão para 'Admin' ou 'Atendimento'.
    """
    def has_permission(self, request, view):
        return _is_in_groups(request.user, ["Admin", "Atendimento"])

class IsAdminOrProducao(BasePermission):
    """
    Permissão para 'Admin' ou 'Produção'.
    """
    def has_permission(self, request, view):
        return _is_in_groups(request.user, ["Admin", "Produção"])


# --- Permissões de Módulo (Combinações) ---

class CanAccessFinance(BasePermission):
    """
    Permissão para Módulos Financeiros.
    (Admin ou Financeiro)
    """
    def has_permission(self, request, view):
        return _is_in_groups(request.user, ["Admin", "Financeiro"])

class CanAccessReports(BasePermission):
    """
    Permissão para Módulos de Relatório.
    (Admin ou Financeiro)
    """
    def has_permission(self, request, view):
        return _is_in_groups(request.user, ["Admin", "Financeiro"])

class CanAccessPedidos(BasePermission):
    """
    Permissão para Módulos de Pedidos/Orçamentos.
    (Admin, Atendimento, Financeiro)
    """
    def has_permission(self, request, view):
        return _is_in_groups(request.user, ["Admin", "Atendimento", "Financeiro"])

class CanAccessClientes(BasePermission):
    """
    Permissão para Módulo de Clientes.
    (Admin ou Atendimento)
    """
    def has_permission(self, request, view):
        return _is_in_groups(request.user, ["Admin", "Atendimento"])

class CanAccessKanban(BasePermission):
    """
    Permissão para Módulo de Produção (Kanban).
    (Admin, Atendimento, Produção)
    """
    def has_permission(self, request, view):
        return _is_in_groups(request.user, ["Admin", "Atendimento", "Produção"])