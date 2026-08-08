// Design System - Campus Salesiano San José
// Estándares visuales unificados para todos los módulos admin

export const DS = {
  // ==================== CONTENEDORES ====================
  page: 'space-y-6',
  
  card: 'card',
  cardHover: 'card-hover',
  cardPadding: 'p-5',
  
  formCard: 'card p-5',

  // ==================== HEADER DE MÓDULO ====================
  moduleHeader: 'flex items-center justify-between',
  moduleTitleGroup: 'flex items-center gap-3',
  moduleIcon: 'w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 text-slate-600',
  moduleIconNeutral: 'w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 text-slate-600',
  moduleIconSize: 'w-5 h-5',
  moduleTitle: 'text-xl font-bold text-slate-900',
  moduleSubtitle: 'text-sm text-slate-500 mt-1',

  // ==================== BOTONES ====================
  btnPrimary: 'btn-primary',
  btnSecondary: 'btn-secondary',
  btnDanger: 'btn-danger',
  btnIcon: 'p-1.5 hover:bg-slate-100 rounded-lg transition-colors',
  btnIconDanger: 'p-1.5 hover:bg-red-50 rounded-lg transition-colors',

  // ==================== FORMULARIOS ====================
  formGrid: 'grid grid-cols-2 gap-4',
  formGrid3: 'grid grid-cols-3 gap-4',
  formGroup: 'space-y-4',
  formDivider: 'border-t border-slate-100 pt-4',
  
  label: 'block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider',
  labelSmall: 'block text-xs text-slate-400 mb-1',
  
  input: 'input',
  select: 'input',
  textarea: 'input min-h-[80px] resize-none',

  // ==================== TABLAS ====================
  tableContainer: 'table-container',
  tableHeader: 'table-header',
  tableRow: 'table-row',
  tableCell: 'px-4 py-3 text-sm text-slate-700',
  tableCellSmall: 'px-4 py-2 text-xs text-slate-500',

  // ==================== BADGES ====================
  badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  badgeGreen: 'badge-green',
  badgeBlue: 'badge-blue',
  badgeYellow: 'badge-yellow',
  badgeRed: 'badge-red',
  badgeSlate: 'badge-slate',

  // ==================== BÚSQUEDA ====================
  searchContainer: 'relative max-w-sm',
  searchIcon: 'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400',
  searchInput: 'input pl-9',

  // ==================== FILTROS ====================
  filterPill: 'filter-pill',
  filterPillActive: 'active',
  filterPillInactive: '',
  filterGroup: 'flex flex-wrap gap-2',

  // ==================== VACÍO ====================
  emptyState: 'text-center py-12 text-slate-400',
  emptyIcon: 'w-10 h-10 mx-auto mb-2 opacity-50',
  emptyText: 'text-sm font-medium',

  // ==================== LOADING ====================
  loading: 'flex justify-center py-12',
  spinner: 'w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin',

  // ==================== MODAL ====================
  modalOverlay: 'fixed inset-0 z-50 flex items-center justify-center bg-black/40',
  modalContent: 'bg-white rounded-xl p-6 w-full max-w-lg shadow-xl',
  modalHeader: 'flex items-center justify-between mb-4',
  modalTitle: 'font-semibold text-slate-900',

  // ==================== CERRAR ====================
  closeBtn: 'p-1 hover:bg-slate-100 rounded-lg',
  closeIcon: 'w-4 h-4 text-slate-500',

  // ==================== GRID ====================
  gridCards: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
  gridCards2: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  gridForm: 'grid grid-cols-2 gap-4',

  // ==================== ACCIONES ====================
  actionsRow: 'flex justify-end gap-2 pt-2',
  hoverReveal: 'opacity-0 group-hover:opacity-100 transition-opacity duration-200',

  // ==================== COLORES POR CICLO ====================
  cycleColors: {
    parvularia: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' },
    1: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
    2: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
    3: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
    4: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  },

  // ==================== ANIMACIÓN ====================
  fadeIn: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
  },
  fadeInFast: {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
  },
  staggerDelay: 0.03,
} as const;

// Helper para colores de ciclo
export function getCycleColor(cycle: string) {
  return DS.cycleColors[cycle as keyof typeof DS.cycleColors] || DS.cycleColors[1];
}

// Helper para badge de estado
export function getStatusBadge(status: string) {
  switch (status) {
    case 'ACTIVO': return DS.badgeGreen;
    case 'INACTIVO': return DS.badgeSlate;
    case 'PENDIENTE': return DS.badgeYellow;
    case 'RECHAZADO': return DS.badgeRed;
    default: return DS.badgeSlate;
  }
}
