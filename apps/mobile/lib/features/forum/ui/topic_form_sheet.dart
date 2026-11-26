import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
    builder: (_) => const TopicForm(),
  );
}

/// Formulário do tópico. `inline` = card dentro da tela (como na web); senão
/// vive numa folha e fecha ao publicar.
class TopicForm extends ConsumerStatefulWidget {
  const TopicForm({super.key, this.inline = false});
  final bool inline;

  @override
  ConsumerState<TopicForm> createState() => _TopicFormSheetState();
}

class _TopicFormSheetState extends ConsumerState<TopicForm> {
  final _title = TextEditingController();
  final _body = TextEditingController();
  bool _busy = false;
  String? _error;
  String? _success;

  @override
  void dispose() {
    _title.dispose();
    _body.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final title = _title.text.trim();
    final body = _body.text.trim();

    setState(() {
      _error = null;
      _success = null;
    });

    if (title.isEmpty || body.isEmpty) {
      setState(() => _error = 'Preencha todos os campos antes de publicar.');
      return;
    }

    setState(() => _busy = true);
    try {
      final created = await ref
          .read(forumControllerProvider.notifier)
          .submitTopic(CreateTopicRequest(title: title, body: body));
      if (mounted) {
        final message = created.status.apiValue == 'Published'
            ? 'Tópico publicado! Já aparece na lista abaixo.'
            : 'Recebemos seu tópico. Ele passou por uma checagem automática e vai aparecer assim que for aprovado.';
        if (widget.inline) {
          _title.clear();
          _body.clear();
          setState(() => _success = message);
        } else {
          Navigator.of(context).pop();
          showInfoSnack(context, message);
        }
      }
    } catch (e) {
      if (mounted) {
        final text = e.toString().replaceFirst('Exception: ', '').trim();
        setState(() => _error = text.isNotEmpty
            ? text
            : 'Não foi possível publicar seu tópico agora. Tente novamente.');
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(authControllerProvider).session;

    final form = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (widget.inline) ...[
          const Text('Novo tópico',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
        ],
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
            inputFormatters: [LengthLimitingTextInputFormatter(150)],
          ),
        ),
        const SizedBox(height: 14),
        LabeledField(
          label: 'Descrição',
          child: AppTextField(
            controller: _body,
            hint: 'Descreva com detalhes...',
            maxLines: 5,
            inputFormatters: [LengthLimitingTextInputFormatter(2000)],
          ),
        ),
        const SizedBox(height: 14),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color:
                context.scheme.surfaceContainerHighest.withValues(alpha: 0.5),
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
                  text:
                      ') — os dados da sua conta, usamos o e-mail só para avisar quando alguém responder.',
                ),
              ],
            ),
          ),
        ),
        if (_error != null) ...[
          const SizedBox(height: 14),
          _FormMessage(text: _error!, color: context.scheme.error),
        ],
        if (_success != null) ...[
          const SizedBox(height: 14),
          _FormMessage(text: _success!, color: context.scheme.primary),
        ],
        const SizedBox(height: 20),
        ElevatedButton(
          onPressed: _busy ? null : _submit,
          child: Text(_busy ? 'Publicando...' : 'Publicar tópico'),
        ),
      ],
    );
    return widget.inline ? FinlyCard(child: form) : form;
  }
}

class _FormMessage extends StatelessWidget {
  const _FormMessage({required this.text, required this.color});
  final String text;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Text(text, style: TextStyle(fontSize: 13, color: color)),
      );
}
