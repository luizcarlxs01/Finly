import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Estado de "ocultar valores" — compartilhado entre Home e Perfil (o
/// "olhinho" em ambos os lugares reflete o mesmo estado, igual ao mockup).
final hideValuesProvider = StateProvider<bool>((ref) => false);
