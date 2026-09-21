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
  late final TextEditingController _authorName;
  late final TextEditingController _authorEmail;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    final session = ref.read(authControllerProvider).session;
    _authorName = TextEditingController(text: session?.name ?? '');
    _authorEmail = TextEditingController(text: session?.email ?? '');
  }

  @override
  void dispose() {
    _title.dispose();
    _body.dispose();
    _authorName.dispose();
    _authorEmail.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final title = _title.text.trim();
    final body = _body.text.trim();
    final name = _authorName.text.trim();
    final email = _authorEmail.text.trim();

    if (title.isEmpty || body.isEmpty || name.isEmpty || email.isEmpty) {
      showInfoSnack(context, 'Preencha todos os campos antes de publicar.');
      return;
    }

    setState(() => _busy = true);
    try {
      final created = await ref.read(forumControllerProvider.notifier).submitTopic(
            CreateTopicRequest(
              title: title,
              body: body,
              authorName: name,
              authorEmail: email,
            ),
          );
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
        LabeledField(
          label: 'Seu nome',
          child: AppTextField(
            controller: _authorName,
            hint: 'Seu nome',
            textInputAction: TextInputAction.next,
            autofillHints: const [AutofillHints.name],
          ),
        ),
        const SizedBox(height: 14),
        LabeledField(
          label: 'Seu e-mail',
          child: AppTextField(
            controller: _authorEmail,
            hint: 'voce@exemplo.com',
            keyboardType: TextInputType.emailAddress,
            autofillHints: const [AutofillHints.email],
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Usamos seu e-mail só para avisar quando alguém responder seu tópico.',
          style: TextStyle(fontSize: 11.5, color: context.mutedForeground),
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
