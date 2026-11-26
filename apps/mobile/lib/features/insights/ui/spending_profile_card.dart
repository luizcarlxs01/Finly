import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme.dart';
import '../../../core/widgets/form_fields.dart';
import '../../../core/widgets/widgets.dart';
import '../../../shared/models/spending_profile.dart';
import '../../transactions/state/finance_controller.dart';

enum _PersonalizadoMode { auto, manual }

String _currency0(double value) {
  final rounded = value.round();
  final digits = rounded.abs().toString();
  final buffer = StringBuffer();
  for (var i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 == 0) buffer.write('.');
    buffer.write(digits[i]);
  }
  return '${rounded < 0 ? '-' : ''}R\$ $buffer';
}

/// Seletor de perfil de gastos — espelha
/// apps/web/src/components/dashboard/insights/spending-profile-card.tsx.
/// Começa recolhido (título + perfil escolhido); ao salvar volta a recolher e
/// mostra "Salvo" por alguns segundos, como na web.
class SpendingProfileCard extends ConsumerStatefulWidget {
  const SpendingProfileCard({super.key, required this.settings});

  final SpendingProfileSettings settings;

  @override
  ConsumerState<SpendingProfileCard> createState() =>
      _SpendingProfileCardState();
}

class _SpendingProfileCardState extends ConsumerState<SpendingProfileCard> {
  late SpendingProfileId _draftId;
  _PersonalizadoMode _mode = _PersonalizadoMode.auto;
  final _goodController = TextEditingController();
  final _okController = TextEditingController();
  bool _busy = false;
  bool _collapsed = true;
  bool _customPanelOpen = false;
  String? _errorMessage;
  bool _saved = false;
  Timer? _savedTimer;

  @override
  void initState() {
    super.initState();
    _syncFromSettings(widget.settings);
    // Preview das faixas precisa reagir a cada tecla, não só ao submeter.
    _goodController.addListener(_onAmountChanged);
    _okController.addListener(_onAmountChanged);
  }

  void _onAmountChanged() => setState(() {});

  @override
  void didUpdateWidget(covariant SpendingProfileCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.settings.id != widget.settings.id ||
        oldWidget.settings.customOkThreshold !=
            widget.settings.customOkThreshold ||
        oldWidget.settings.customGoodThreshold !=
            widget.settings.customGoodThreshold) {
      _syncFromSettings(widget.settings);
    }
  }

  // Não persistimos qual modo a pessoa usou da última vez — inferimos pelo
  // valor: se "Mediano" bate com o cálculo proporcional do "Bom" salvo,
  // mostramos "auto"; senão ela personalizou os dois, mostramos "manual" com
  // o valor real (nunca um recalculado que não bate com o que está salvo).
  void _syncFromSettings(SpendingProfileSettings settings) {
    _draftId = settings.id;
    final good = settings.customGoodThreshold;
    final ok = settings.customOkThreshold;
    _goodController.text = good != null ? _formatInput(good) : '';
    _okController.text = ok != null ? _formatInput(ok) : '';
    if (good != null && ok != null) {
      final autoOk = deriveCustomOkThreshold(good);
      _mode = (autoOk - ok).abs() < 0.01
          ? _PersonalizadoMode.auto
          : _PersonalizadoMode.manual;
    } else {
      _mode = _PersonalizadoMode.auto;
    }
  }

  String _formatInput(double value) => value == value.roundToDouble()
      ? value.toInt().toString()
      : value.toString();

  @override
  void dispose() {
    _savedTimer?.cancel();
    _goodController.removeListener(_onAmountChanged);
    _okController.removeListener(_onAmountChanged);
    _goodController.dispose();
    _okController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    setState(() {
      _errorMessage = null;
      _saved = false;
    });

    final good = parseAmount(_goodController.text);
    final ok = _mode == _PersonalizadoMode.manual
        ? parseAmount(_okController.text)
        : null;

    final nextSettings = _draftId == SpendingProfileId.personalizado
        ? SpendingProfileSettings(
            id: _draftId,
            customGoodThreshold: good,
            customOkThreshold: _mode == _PersonalizadoMode.manual ? ok : null,
          )
        : SpendingProfileSettings(id: _draftId);

    if (_draftId == SpendingProfileId.personalizado) {
      final validationError = validateCustomThresholds(
        goodThreshold: good,
        okThreshold: _mode == _PersonalizadoMode.manual ? ok : null,
      );
      if (validationError != null) {
        // A web chama a faixa intermediária de "Mediano".
        setState(() => _errorMessage =
            validationError.replaceAll('Mais ou menos', 'Mediano'));
        return;
      }
    }

    setState(() => _busy = true);
    try {
      await ref
          .read(financeControllerProvider.notifier)
          .updateSpendingProfile(nextSettings);
      if (!mounted) return;
      setState(() {
        _saved = true;
        _customPanelOpen = false;
        _collapsed = true;
      });
      _savedTimer?.cancel();
      _savedTimer = Timer(const Duration(seconds: 4), () {
        if (mounted) setState(() => _saved = false);
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e is StateError && e.message.trim().isNotEmpty
              ? e.message
              : 'Não foi possível salvar o perfil de gastos agora.';
        });
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Widget _collapsedView(BuildContext context) {
    return FinlyCard(
      padding: EdgeInsets.zero,
      child: Semantics(
        button: true,
        label:
            'Expandir perfil de gastos. Perfil selecionado: ${_draftId.label}',
        child: InkWell(
          borderRadius: BorderRadius.circular(AppColors.cardRadius),
          onTap: () => setState(() => _collapsed = false),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 12, 12),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Seu perfil de gastos',
                          style: TextStyle(
                              fontSize: 16, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 4),
                      Row(children: [
                        Flexible(
                          child: Text(_draftId.label,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                  color: context.mutedForeground)),
                        ),
                        if (_saved) ...[
                          const SizedBox(width: 8),
                          Icon(Icons.check,
                              size: 14, color: context.scheme.primary),
                          const SizedBox(width: 4),
                          Text('Salvo',
                              style: TextStyle(
                                  fontSize: 12, color: context.scheme.primary)),
                        ],
                      ]),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, size: 22),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _profileSelector(BuildContext context) {
    final scheme = context.scheme;
    Widget cell(SpendingProfileId id) {
      final selected = _draftId == id;
      return Expanded(
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () => setState(() {
            _draftId = id;
            _customPanelOpen = id == SpendingProfileId.personalizado;
            _errorMessage = null;
            _saved = false;
          }),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 10),
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: selected ? scheme.surface : Colors.transparent,
              borderRadius: BorderRadius.circular(10),
              boxShadow: selected
                  ? [
                      BoxShadow(
                          color: Colors.black.withValues(alpha: 0.08),
                          blurRadius: 4,
                          offset: const Offset(0, 1))
                    ]
                  : null,
            ),
            child: Text(id.label,
                style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color:
                        selected ? scheme.onSurface : context.mutedForeground)),
          ),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        children: [
          Row(children: [
            cell(SpendingProfileId.economico),
            const SizedBox(width: 4),
            cell(SpendingProfileId.padrao),
          ]),
          const SizedBox(height: 4),
          Row(children: [
            cell(SpendingProfileId.gastao),
            const SizedBox(width: 4),
            cell(SpendingProfileId.personalizado),
          ]),
        ],
      ),
    );
  }

  Widget _modeButton(
      BuildContext context, _PersonalizadoMode mode, String label) {
    final scheme = context.scheme;
    final selected = _mode == mode;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _mode = mode),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 9, horizontal: 6),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: selected ? scheme.primary.withValues(alpha: 0.10) : null,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
                color: selected
                    ? scheme.primary
                    : scheme.outline.withValues(alpha: 0.7)),
          ),
          child: Text(label,
              textAlign: TextAlign.center,
              style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: selected ? scheme.primary : context.mutedForeground)),
        ),
      ),
    );
  }

  Widget _customPanel(BuildContext context, double? good) {
    final amountFormatters = [
      FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]')),
    ];
    const keyboard = TextInputType.numberWithOptions(decimal: true);
    return Container(
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: context.scheme.surface,
        borderRadius: BorderRadius.circular(14),
        border:
            Border.all(color: context.scheme.outline.withValues(alpha: 0.7)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            _modeButton(context, _PersonalizadoMode.auto, 'Só o valor de Bom'),
            const SizedBox(width: 8),
            _modeButton(
                context, _PersonalizadoMode.manual, 'Personalizar tudo'),
            IconButton(
              tooltip: 'Fechar configurações personalizadas',
              visualDensity: VisualDensity.compact,
              onPressed: () => setState(() => _customPanelOpen = false),
              icon: const Icon(Icons.close, size: 18),
            ),
          ]),
          const SizedBox(height: 12),
          if (_mode == _PersonalizadoMode.auto) ...[
            LabeledField(
              label: 'A partir de quanto você considera uma boa sobra?',
              child: AppTextField(
                controller: _goodController,
                hint: 'Ex.: 5000',
                keyboardType: keyboard,
                inputFormatters: amountFormatters,
              ),
            ),
            if (good != null && good > 0) ...[
              const SizedBox(height: 6),
              Text(
                'Calculamos "Mediano" a partir de '
                '${_currency0(deriveCustomOkThreshold(good))} automaticamente.',
                style: TextStyle(fontSize: 11, color: context.mutedForeground),
              ),
            ],
          ] else ...[
            LabeledField(
              label: '"Mediano" a partir de',
              child: AppTextField(
                controller: _okController,
                hint: 'Ex.: 1000',
                keyboardType: keyboard,
                inputFormatters: amountFormatters,
              ),
            ),
            const SizedBox(height: 12),
            LabeledField(
              label: '"Bom" a partir de',
              child: AppTextField(
                controller: _goodController,
                hint: 'Ex.: 5000',
                keyboardType: keyboard,
                inputFormatters: amountFormatters,
              ),
            ),
          ],
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_collapsed) return _collapsedView(context);

    final good = parseAmount(_goodController.text);
    final ok = _mode == _PersonalizadoMode.manual
        ? parseAmount(_okController.text)
        : null;
    final previewThresholds = _draftId == SpendingProfileId.personalizado
        ? resolveSpendingThresholds(SpendingProfileSettings(
            id: SpendingProfileId.personalizado,
            customGoodThreshold: good,
            customOkThreshold: ok,
          ))
        : resolveSpendingThresholds(SpendingProfileSettings(id: _draftId));

    return FinlyCard(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            const Expanded(
              child: Text('Seu perfil de gastos',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
            ),
            IconButton(
              tooltip: 'Recolher perfil de gastos',
              visualDensity: VisualDensity.compact,
              onPressed: () => setState(() {
                _customPanelOpen = false;
                _collapsed = true;
              }),
              icon: const Icon(Icons.chevron_left, size: 22),
            ),
          ]),
          const SizedBox(height: 8),
          _profileSelector(context),
          if (_customPanelOpen && _draftId == SpendingProfileId.personalizado)
            _customPanel(context, good),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _busy ? null : _handleSave,
              child: Text(_busy ? 'Salvando...' : 'Salvar'),
            ),
          ),
          const SizedBox(height: 14),
          _ThresholdPreview(
              ok: previewThresholds.ok, good: previewThresholds.good),
          if (_errorMessage != null) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: context.scheme.error.withValues(alpha: 0.10),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                    color: context.scheme.error.withValues(alpha: 0.3)),
              ),
              child: Text(_errorMessage!,
                  style: TextStyle(fontSize: 12, color: context.scheme.error)),
            ),
          ],
        ],
      ),
    );
  }
}

/// Faixas Ruim / Mediano / Bom — grade com divisores, como na web
/// (`ThresholdPreview`): só "Bom" usa a cor primária.
class _ThresholdPreview extends StatelessWidget {
  const _ThresholdPreview({required this.ok, required this.good});

  final double ok;
  final double good;

  @override
  Widget build(BuildContext context) {
    final scheme = context.scheme;
    final divider = Container(
        width: 1, height: 44, color: scheme.outline.withValues(alpha: 0.6));
    return Container(
      decoration: BoxDecoration(
        color: scheme.surface.withValues(alpha: 0.45),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: scheme.outline.withValues(alpha: 0.5)),
      ),
      child: Row(
        children: [
          Expanded(
              child: _Cell(
                  label: 'RUIM',
                  value: '< ${_currency0(ok)}',
                  color: scheme.onSurface,
                  labelColor: context.mutedForeground)),
          divider,
          Expanded(
              child: _Cell(
                  label: 'MEDIANO',
                  value: '${_currency0(ok)} – ${_currency0(good)}',
                  color: scheme.onSurface,
                  labelColor: context.mutedForeground)),
          divider,
          Expanded(
              child: _Cell(
                  label: 'BOM',
                  value: '> ${_currency0(good)}',
                  color: scheme.primary,
                  labelColor: scheme.primary)),
        ],
      ),
    );
  }
}

class _Cell extends StatelessWidget {
  const _Cell({
    required this.label,
    required this.value,
    required this.color,
    required this.labelColor,
  });

  final String label;
  final String value;
  final Color color;
  final Color labelColor;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
      child: Column(
        children: [
          Text(label,
              style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  letterSpacing: 0.5,
                  color: labelColor)),
          const SizedBox(height: 2),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(value,
                maxLines: 1,
                style: TextStyle(
                    fontSize: 12, fontWeight: FontWeight.w600, color: color)),
          ),
        ],
      ),
    );
  }
}
