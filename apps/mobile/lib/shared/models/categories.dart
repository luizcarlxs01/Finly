/// Espelho de apps/web/src/types/transaction-category.ts — mesma lista, mesma
/// ordem, mesmos rótulos. `geral` é o padrão.
class TransactionCategories {
  TransactionCategories._();

  static const String defaultCategory = 'geral';

  static const List<String> all = [
    'alimentacao',
    'transporte',
    'moradia',
    'saude',
    'educacao',
    'lazer',
    'salario',
    'freelance',
    'contas',
    'investimentos',
    'compras',
    'geral',
  ];

  static const Map<String, String> _labels = {
    'alimentacao': 'Alimentação',
    'transporte': 'Transporte',
    'moradia': 'Moradia',
    'saude': 'Saúde',
    'educacao': 'Educação',
    'lazer': 'Lazer',
    'salario': 'Salário',
    'freelance': 'Freelance',
    'contas': 'Contas',
    'investimentos': 'Investimentos',
    'compras': 'Compras',
    'geral': 'Geral',
  };

  static String label(String category) =>
      _labels[category] ?? _labels[defaultCategory]!;

  /// Metas aceitam "general" além das categorias de transação (goal-list.tsx).
  static String goalLabel(String category) =>
      category == 'general' ? 'Geral' : label(category);
}
