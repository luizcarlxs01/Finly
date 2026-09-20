import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme.dart';
import '../../../core/widgets/widgets.dart';
import '../state/auth_controller.dart';

/// Espelha apps/web/src/components/auth/email-verification-form.tsx —
/// aparece no lugar do login/registro enquanto há uma verificação pendente
/// (`AuthState.pendingVerification`).
class EmailVerificationPanel extends ConsumerStatefulWidget {
  const EmailVerificationPanel({super.key, required this.email});

  final String email;

  @override
  ConsumerState<EmailVerificationPanel> createState() =>
      _EmailVerificationPanelState();
}

class _EmailVerificationPanelState extends ConsumerState<EmailVerificationPanel> {
  final _code = TextEditingController();
  String? _error;
  String? _resendMessage;

  @override
  void initState() {
    super.initState();
    _code.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    setState(() {
      _error = null;
      _resendMessage = null;
    });
    try {
      await ref.read(authControllerProvider.notifier).verifyCode(_code.text.trim());
      if (mounted) Navigator.of(context).maybePop();
    } catch (error) {
      setState(() => _error = error.toString());
    }
  }

  Future<void> _resend() async {
    setState(() {
      _error = null;
      _resendMessage = null;
    });
    try {
      await ref.read(authControllerProvider.notifier).resendCode();
      setState(() => _resendMessage = 'Enviamos um novo código para o seu e-mail.');
    } catch (error) {
      setState(() => _error = error.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    final isSubmitting = ref.watch(authControllerProvider).isSubmitting;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Confirme seu e-mail',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 6),
        Text.rich(
          TextSpan(
            style: TextStyle(fontSize: 13, color: context.mutedForeground),
            children: [
              const TextSpan(text: 'Enviamos um código de 6 dígitos para '),
              TextSpan(
                text: widget.email,
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
              const TextSpan(text: '. Ele expira em 10 minutos.'),
            ],
          ),
        ),
        const SizedBox(height: 14),
        FinlyCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextField(
                controller: _code,
                keyboardType: TextInputType.number,
                textAlign: TextAlign.center,
                maxLength: 6,
                autofillHints: const [AutofillHints.oneTimeCode],
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                style: const TextStyle(fontSize: 20, letterSpacing: 8),
                decoration: const InputDecoration(
                  counterText: '',
                  hintText: '000000',
                ),
                onSubmitted: (_) => _verify(),
              ),
              if (_error != null) ...[
                const SizedBox(height: 14),
                ErrorBanner(_error!),
              ],
              if (_resendMessage != null) ...[
                const SizedBox(height: 14),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: context.scheme.primary.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(AppColors.fieldRadius),
                    border: Border.all(
                      color: context.scheme.primary.withValues(alpha: 0.25),
                    ),
                  ),
                  child: Text(
                    _resendMessage!,
                    style: TextStyle(fontSize: 13, color: context.scheme.primary),
                  ),
                ),
              ],
              const SizedBox(height: 18),
              ElevatedButton(
                onPressed: isSubmitting || _code.text.trim().length != 6
                    ? null
                    : _verify,
                child: Text(isSubmitting ? 'Confirmando...' : 'Confirmar código'),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  TextButton(
                    onPressed: isSubmitting ? null : _resend,
                    child: const Text('Reenviar código'),
                  ),
                  TextButton(
                    onPressed: () => ref
                        .read(authControllerProvider.notifier)
                        .cancelVerification(),
                    child: const Text('Cancelar'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}
