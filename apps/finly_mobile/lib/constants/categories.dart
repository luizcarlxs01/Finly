import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class CategoryInfo {
  final String id;
  final String label;
  final IconData icon;
  final Color color;
  final Color soft;

  const CategoryInfo({
    required this.id,
    required this.label,
    required this.icon,
    required this.color,
    required this.soft,
  });
}

/// Categorias fixas — mesma lista do apps/web (types/transaction-category.ts).
/// Ícones são Material equivalentes aos Lucide usados no mockup.
const kCategories = <CategoryInfo>[
  CategoryInfo(
    id: 'salario',
    label: 'Salário',
    icon: Icons.work_outline,
    color: AppColors.catSalario,
    soft: AppColors.successSoft,
  ),
  CategoryInfo(
    id: 'freelance',
    label: 'Freelance',
    icon: Icons.account_balance_wallet_outlined,
    color: AppColors.catSalario,
    soft: AppColors.successSoft,
  ),
  CategoryInfo(
    id: 'compras',
    label: 'Compras',
    icon: Icons.shopping_bag_outlined,
    color: AppColors.catCompras,
    soft: AppColors.primarySoft,
  ),
  CategoryInfo(
    id: 'alimentacao',
    label: 'Alimentação',
    icon: Icons.restaurant_outlined,
    color: AppColors.catAlimentacao,
    soft: AppColors.warningSoft,
  ),
  CategoryInfo(
    id: 'transporte',
    label: 'Transporte',
    icon: Icons.directions_car_outlined,
    color: AppColors.catTransporte,
    soft: Color(0xFFE3EEFC),
  ),
  CategoryInfo(
    id: 'moradia',
    label: 'Moradia',
    icon: Icons.home_outlined,
    color: AppColors.catMoradia,
    soft: Color(0xFFFCE4E4),
  ),
  CategoryInfo(
    id: 'contas',
    label: 'Contas',
    icon: Icons.bolt_outlined,
    color: AppColors.catContas,
    soft: Color(0xFFFDEEDE),
  ),
  CategoryInfo(
    id: 'saude',
    label: 'Saúde',
    icon: Icons.favorite_outline,
    color: AppColors.catSaude,
    soft: Color(0xFFFCE4E4),
  ),
  CategoryInfo(
    id: 'lazer',
    label: 'Lazer',
    icon: Icons.movie_outlined,
    color: AppColors.catLazer,
    soft: Color(0xFFF0E6FB),
  ),
  CategoryInfo(
    id: 'educacao',
    label: 'Educação',
    icon: Icons.school_outlined,
    color: AppColors.catEducacao,
    soft: Color(0xFFE2F0FB),
  ),
  CategoryInfo(
    id: 'investimentos',
    label: 'Investimentos',
    icon: Icons.savings_outlined,
    color: AppColors.catInvestimentos,
    soft: Color(0xFFE1F3E8),
  ),
  CategoryInfo(
    id: 'geral',
    label: 'Geral',
    icon: Icons.circle_outlined,
    color: AppColors.catGeral,
    soft: AppColors.primarySofter,
  ),
];

CategoryInfo categoryById(String id) {
  return kCategories.firstWhere(
    (category) => category.id == id,
    orElse: () => kCategories.last,
  );
}
