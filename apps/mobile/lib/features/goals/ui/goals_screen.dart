import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/app.dart';
import '../../../app/shell.dart';
import '../../../app/theme.dart';
import '../../../core/format/formatters.dart';
import '../../../core/widgets/widgets.dart';
import '../../../shared/models/categories.dart';
import '../../../shared/models/goal.dart';
import '../state/goals_controller.dart';
import 'goal_form_sheet.dart';
import 'goal_progress_sheet.dart';

/// Espelha apps/web/src/components/dashboard/views/dashboard-goals-view.tsx
/// + goal-list.tsx.
class GoalsScreen extends ConsumerWidget {
  const GoalsScreen({super.key});

  Future<void> _confirmRemove(
      BuildContext context, WidgetRef ref, Goal goal) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Remover meta'),
        content: Text('Remover "${goal.title}"? Essa ação não pode ser desfeita.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancelar')),
          FilledButton(
            style: FilledButton.styleFrom(
                backgroundColor: Theme.of(ctx).colorScheme.error),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Remover'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      try {
        await ref.read(goalsControllerProvider.notifier).deleteGoal(goal.id);
      } catch (e) {
        if (context.mounted) showErrorSnack(context, e);
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final goalsAsync = ref.watch(goalsControllerProvider);

    return Scaffold(
      appBar:
          const FinlyAppBar(title: 'Metas', themeToggle: ThemeToggleButton()),
      body: RefreshIndicator(
        onRefresh: () => ref.read(goalsControllerProvider.notifier).refresh(),
        child: goalsAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ListView(
            padding: const EdgeInsets.all(16),
            children: [
              ErrorBanner(e.toString(),
                  onRetry: () =>
                      ref.read(goalsControllerProvider.notifier).refresh()),
            ],
          ),
          data: (state) => ListView(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 28),
            children: [
              const SectionHeader(
                subtitle:
                    'Organize seus objetivos e acompanhe o quanto falta para chegar lá.',
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  _StatBox(label: 'Metas ativas', value: '${state.goals.length}'),
                  const SizedBox(width: 10),
                  _StatBox(
                      label: 'Acumulado',
                      value: Fmt.currency(state.totalProgress)),
                  const SizedBox(width: 10),
                  _StatBox(
                      label: 'Falta', value: Fmt.currency(state.remaining)),
                ],
              ),
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => showGoalFormSheet(context),
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('Nova meta'),
                ),
              ),
              const SizedBox(height: 14),
              if (state.goals.isEmpty)
                const EmptyState(
                  title: 'Nenhuma meta por aqui ainda',
                  description:
                      'Crie uma meta para começar a acompanhar sua evolução.',
                )
              else
                ...state.goals.map(
                  (goal) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _GoalCard(
                      goal: goal,
                      onUpdate: () => showGoalProgressSheet(context, goal),
                      onRemove: () => _confirmRemove(context, ref, goal),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatBox extends StatelessWidget {
  const _StatBox({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: context.scheme.surface,
          borderRadius: BorderRadius.circular(AppColors.fieldRadius),
          border: Border.all(color: context.scheme.outline),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label,
                style:
                    TextStyle(fontSize: 11, color: context.mutedForeground)),
            const SizedBox(height: 4),
            Text(value,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                    fontSize: 15, fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }
}

class _GoalCard extends StatelessWidget {
  const _GoalCard(
      {required this.goal, required this.onUpdate, required this.onRemove});
  final Goal goal;
  final VoidCallback onUpdate;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final scheme = context.scheme;
    final progress = goal.progressPercent;

    return FinlyCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(goal.title,
              style:
                  const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: [
              PillBadge(label: TransactionCategories.goalLabel(goal.category)),
              if (goal.deadline != null)
                PillBadge(
                    label: Fmt.businessDate(goal.deadline) ?? goal.deadline!),
            ],
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: scheme.surface,
              borderRadius: BorderRadius.circular(AppColors.fieldRadius),
              border: Border.all(color: scheme.outline),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Progresso',
                        style: TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w600)),
                    Text('${progress.toStringAsFixed(0)}%',
                        style: const TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w700)),
                  ],
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: LinearProgressIndicator(
                    value: progress / 100,
                    minHeight: 8,
                    backgroundColor: scheme.surfaceContainerHighest,
                    valueColor: AlwaysStoppedAnimation(scheme.primary),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _MiniGoalStat(
                        label: 'Meta',
                        value: Fmt.currency(goal.targetAmount)),
                    const SizedBox(width: 8),
                    _MiniGoalStat(
                        label: 'Guardado',
                        value: Fmt.currency(goal.currentAmount)),
                    const SizedBox(width: 8),
                    _MiniGoalStat(
                        label: 'Falta',
                        value: Fmt.currency(goal.remainingAmount)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                      minimumSize: const Size.fromHeight(40)),
                  onPressed: onUpdate,
                  icon: const Icon(Icons.edit_outlined, size: 16),
                  label: const Text('Atualizar progresso'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(40),
                    foregroundColor: scheme.error,
                    side: BorderSide(color: scheme.error.withValues(alpha: 0.5)),
                  ),
                  onPressed: onRemove,
                  icon: const Icon(Icons.delete_outline, size: 16),
                  label: const Text('Remover'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MiniGoalStat extends StatelessWidget {
  const _MiniGoalStat({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: context.scheme.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: context.scheme.outline),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label,
                style:
                    TextStyle(fontSize: 10.5, color: context.mutedForeground)),
            const SizedBox(height: 2),
            Text(value,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                    fontSize: 12.5, fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }
}
