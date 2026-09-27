import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme.dart';
import '../../../core/widgets/form_fields.dart';
import '../../../core/widgets/widgets.dart';
import '../../auth/state/auth_controller.dart';
import '../../transactions/ui/sheet_scaffold.dart';
import '../data/forum_models.dart';
import '../state/forum_controller.dart';

/// "Novo tópico" — espelha apps/web/src/components/dashboard/forum/topic-form.tsx.
Future<void> showTopicFormSheet(BuildContext context) {
  return showFinlySheet(
    context: context,
    title: 'Novo tópico',
    builder: (_) => const _TopicFormSheet(),
  );
}

class _TopicFormSheet extends ConsumerStatefulWidget {
  const _TopicFormSheet();

  @override
  ConsumerState<_TopicFormSheet> createState() => _TopicFormSheetState();
}

class _TopicFormSheetState extends ConsumerState<_TopicFormSheet> {
  final _title = TextEditingController();
  final _body = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _title.dispose();
    _body.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final title = _title.text.trim();
    final body = _body.text.trim();

    if (title.isEmpty || body.isEmpty) {
      showInfoSnack(context, 'Preencha todos os campos antes de publicar.');
      return;
    }

    setState(() => _busy = true);
    try {
      final created = await ref
          .read(forumControllerProvider.notifier)
          .submitTopic(CreateTopicRequest(title: title, body: body));
      if (mounted) {
        Navigator.of(context).pop();
        showInfoSnack(
          context,
          created.status.apiValue == 'Published'
              ? 'Tópico publicado! Já aparece na lista.'
              : 'Recebemos seu tópico. Ele passou por uma checagem automática e vai aparecer assim que for aprovado.',
        );
      }
    } catch (e) {
      if (mounted) showErrorSnack(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(authControllerProvider).session;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Deixe sua dúvida, reclamação ou sugestão. Respondemos por aqui e por e-mail.',
          style: TextStyle(fontSize: 13, color: context.mutedForeground),
        ),
        const SizedBox(height: 16),
        LabeledField(
          label: 'Título',
          child: AppTextField(
            controller: _title,
            hint: 'Ex.: Não consigo editar uma parcela',
            textInputAction: TextInputAction.next,
          ),
        ),
        const SizedBox(height: 14),
        LabeledField(
          label: 'Descrição',
          child: AppTextField(
            controller: _body,
            hint: 'Descreva com detalhes...',
            maxLines: 5,
          ),
        ),
        const SizedBox(height: 14),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: context.scheme.surfaceContainerHighest.withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Text.rich(
            TextSpan(
              style: TextStyle(fontSize: 12.5, color: context.mutedForeground),
              children: [
                const TextSpan(text: 'Publicando como '),
                TextSpan(
                  text: session?.name ?? '',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                const TextSpan(text: ' ('),
                TextSpan(
                  text: session?.email ?? '',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                const TextSpan(
                  text: ') — os dados da sua conta, usamos o e-mail só para avisar quando alguém responder.',
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),
        ElevatedButton(
          onPressed: _busy ? null : _submit,
          child: Text(_busy ? 'Publicando...' : 'Publicar tópico'),
        ),
      ],
    );
  }
}
