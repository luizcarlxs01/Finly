import 'package:flutter/material.dart';

/// Equivalente Flutter de `category-icons.ts` (lucide) da web.
IconData categoryIcon(String category) => switch (category) {
      'alimentacao' => Icons.restaurant,
      'transporte' => Icons.directions_car_outlined,
      'moradia' => Icons.home_outlined,
      'saude' => Icons.favorite_border,
      'educacao' => Icons.school_outlined,
      'lazer' => Icons.sports_esports_outlined,
      'salario' => Icons.payments_outlined,
      'freelance' => Icons.work_outline,
      'contas' => Icons.receipt_long_outlined,
      'investimentos' => Icons.trending_up,
      'compras' => Icons.shopping_bag_outlined,
      _ => Icons.track_changes,
    };
