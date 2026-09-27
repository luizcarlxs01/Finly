import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme.dart';
import '../../../core/format/formatters.dart';
import '../../../core/widgets/form_fields.dart';
import '../../../core/widgets/widgets.dart';
import '../../../shared/models/spending_profile.dart';
import '../../transactions/state/finance_controller.dart';

enum _PersonalizadoMode { auto, manual }

/// Seletor de perfil de gastos — espelha
/// apps/web/src/components/dashboard/insights/spending-profile-card.tsx.
/// Calibra os limiares usados por buildDashboardInsights.
class SpendingProfileCard extends ConsumerStatefulWidget {
  const SpendingProfileCard({super.key, required this.settings});

  final SpendingProfileSettings settings;

  @override
  ConsumerState<SpendingProfileCard> createState() => _SpendingProfileCardState();
}

class _SpendingProfileCardState extends ConsumerState<SpendingProfileCard> {
  late SpendingProfileId _draftId;
  _PersonalizadoMode _mode = _PersonalizadoMode.auto;
  final _goodController = TextEditingController();
  final _okController = TextEditingController();
  bool _busy = false;
  String? _errorMessage;
  String? _successMessage;

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
        oldWidget.settings.customOkThreshold != widget.settings.customOkThreshold ||
        oldWidget.settings.customGoodThreshold != widget.settings.customGoodThreshold) {
      _syncFromSettings(widget.settings);
    }
  }

  // Não persistimos qual modo a pessoa usou da última vez — inferimos pelo
  // valor: se "Mais ou menos" bate com o cálculo proporcional do "Bom" salvo,
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
      _mode = (autoOk - ok).abs() < 0.01 ? _PersonalizadoMode.auto : _PersonalizadoMode.manual;
    } else {
      _mode = _PersonalizadoMode.auto;
    }
  }

  String _formatInput(double value) =>
      value == value.roundToDouble() ? value.toInt().toString() : value.toString();

  @override
  void dispose() {
    _goodController.removeListener(_onAmountChanged);
    _okController.removeListener(_onAmountChanged);
    _goodController.dispose();
    _okController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    setState(() {
      _errorMessage = null;
      _successMessage = null;
    });

    final good = parseAmount(_goodController.text);
    final ok = _mode == _PersonalizadoMode.manual ? parseAmount(_okController.text) : null;

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
        setState(() => _errorMessage = validationError);
        return;
      }
    }

    setState(() => _busy = true);
    try {
      await ref.read(financeControllerProvider.notifier).updateSpendingProfile(nextSettings);
      if (mounted) setState(() => _successMessage = 'Perfil de gastos atualizado.');
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e is StateError ? e.message : 'Não foi possível salvar agora.';
        });
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final good = parseAmount(_goodController.text);
    final ok = _mode == _PersonalizadoMode.manual ? parseAmount(_okController.text) : null;
    final previewThresholds = _draftId == SpendingProfileId.personalizado
        ? resolveSpendingThresholds(SpendingProfileSettings(
            id: SpendingProfileId.personalizado,
            customGoodThreshold: good,
            customOkThreshold: ok,
          ))
        : resolveSpendingThresholds(SpendingProfileSettings(id: _draftId));

    return FinlyCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Seu perfil de gastos',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
          const SizedBox(height: 2),
          Text(
            'Calibra o que consideramos uma boa sobra de acordo com sua realidade financeira.',
            style: TextStyle(fontSize: 12.5, color: context.mutedForeground),
          ),
          const SizedBox(height: 12),
          SegmentedSelector<SpendingProfileId>(
            value: _draftId,
            options: SpendingProfileId.values
                .map((id) => (value: id, label: id.label))
                .toList(),
            onChanged: (id) => setState(() {
              _draftId = id;
              _errorMessage = null;
              _successMessage = null;
            }),
          ),
          const SizedBox(height: 8),
          Text(_draftId.description,
              style: TextStyle(fontSize: 12, color: context.mutedForeground)),
          if (_draftId == SpendingProfileId.personalizado) ...[
            const SizedBox(height: 12),
            SegmentedSelector<_PersonalizadoMode>(
              value: _mode,
              options: const [
                (value: _PersonalizadoMode.auto, label: 'Só o valor de Bom'),
                (value: _PersonalizadoMode.manual, label: 'Personalizar tudo'),
              ],
              onChanged: (mode) => setState(() => _mode = mode),
            ),
            const SizedBox(height: 12),
            if (_mode == _PersonalizadoMode.auto) ...[
              LabeledField(
                label: 'A partir de quanto você considera uma boa sobra?',
                child: AppTextField(
                  controller: _goodController,
                  hint: 'Ex.: 5000',
                  keyboardType: TextInputType.number,
                  onSubmitted: (_) => setState(() {}),
                ),
              ),
              if (good != null && good > 0) ...[
                const SizedBox(height: 6),
                Text(
                  'Calculamos "Mais ou menos" a partir de '
                  '${Fmt.currency(deriveCustomOkThreshold(good))} automaticamente.',
                  style: TextStyle(fontSize: 11.5, color: context.mutedForeground),
                ),
              ],
            ] else
              Row(
                children: [
                  Expanded(
                    child: LabeledField(
                      label: '"Mais ou menos" a partir de',
                      child: AppTextField(
                        controller: _okController,
                        hint: 'Ex.: 1000',
                        keyboardType: TextInputType.number,
                        onSubmitted: (_) => setState(() {}),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: LabeledField(
                      label: '"Bom" a partir de',
                      child: AppTextField(
                        controller: _goodController,
                        hint: 'Ex.: 5000',
                        keyboardType: TextInputType.number,
                        onSubmitted: (_) => setState(() {}),
                      ),
                    ),
                  ),
                ],
              ),
          ],
          const SizedBox(height: 14),
          _ThresholdPreview(ok: previewThresholds.ok, good: previewThresholds.good),
          if (_errorMessage != null) ...[
            const SizedBox(height: 10),
            ErrorBanner(_errorMessage!),
          ],
          if (_successMessage != null) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: context.scheme.primary.withValues(alpha: 0.10),
                borderRadius: BorderRadius.circular(AppColors.fieldRadius),
              ),
              child: Text(_successMessage!,
                  style: TextStyle(fontSize: 12.5, color: context.scheme.primary)),
            ),
          ],
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _busy ? null : _handleSave,
              child: Text(_busy ? 'Salvando...' : 'Salvar perfil de gastos'),
            ),
          ),
        ],
      ),
    );
  }
}

class _ThresholdPreview extends StatelessWidget {
  const _ThresholdPreview({required this.ok, required this.good});

  final double ok;
  final double good;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _Tile(
            label: 'RUIM',
            value: '< ${Fmt.currency(ok)}',
            color: context.scheme.error,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _Tile(
            label: 'MAIS OU MENOS',
            value: '${Fmt.currency(ok)} – ${Fmt.currency(good)}',
            color: AppColors.warning,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _Tile(
            label: 'BOM',
            value: '> ${Fmt.currency(good)}',
            color: context.scheme.primary,
          ),
        ),
      ],
    );
  }
}

class _Tile extends StatelessWidget {
  const _Tile({required this.label, required this.value, required this.color});

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(AppColors.fieldRadius),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Text(label,
              textAlign: TextAlign.center,
              style: TextStyle(
                  fontSize: 9.5, fontWeight: FontWeight.w700, color: color, letterSpacing: 0.3)),
          const SizedBox(height: 2),
          Text(value,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: color)),
        ],
      ),
    );
  }
}
