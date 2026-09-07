import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme.dart';
import '../../../core/widgets/form_fields.dart';
import '../../../core/widgets/widgets.dart';
import '../data/auth_models.dart';
import '../state/auth_controller.dart';
import 'password_strength_bar.dart';

/// Espelha apps/web/src/components/auth/account-access-card.tsx (estado
/// deslogado) + login-form.tsx + register-form.tsx. Alterna entre Entrar e
/// Criar conta pelo mesmo `activeIntent`, sem componentes duplicados. É um
/// painel (sem Scaffold) embutido em [AccountScreen].
enum _Intent { login, register }

class AccountAccessPanel extends ConsumerStatefulWidget {
  const AccountAccessPanel({super.key});

  @override
  ConsumerState<AccountAccessPanel> createState() => _AccountAccessPanelState();
}

class _AccountAccessPanelState extends ConsumerState<AccountAccessPanel> {
  _Intent _intent = _Intent.login;

  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _showPassword = false;
  String _passwordValue = '';
  String? _error;

  @override
  void initState() {
    super.initState();
    _password.addListener(
      () => setState(() => _passwordValue = _password.text),
    );
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _error = null);
    final controller = ref.read(authControllerProvider.notifier);
    try {
      if (_intent == _Intent.login) {
        await controller.login(
          LoginRequest(email: _email.text.trim(), password: _password.text),
        );
      } else {
        await controller.register(
          RegisterRequest(
            name: _name.text.trim(),
            email: _email.text.trim(),
            password: _password.text,
          ),
        );
      }
      // Sucesso -> o app passa a modo com conta e mostra os dados da API.
      if (mounted) Navigator.of(context).maybePop();
    } catch (error) {
      setState(() => _error = error.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    final isSubmitting = ref.watch(authControllerProvider).isSubmitting;
    final isRegister = _intent == _Intent.register;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Use o Finly com sua conta',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 6),
        Text(
          'Entre ou crie uma conta para sincronizar seus dados e acessá-los em outros dispositivos.',
          style: TextStyle(fontSize: 13, color: context.mutedForeground),
        ),
        const SizedBox(height: 14),
        SegmentedSelector<_Intent>(
          value: _intent,
          options: const [
            (value: _Intent.login, label: 'Entrar na conta'),
            (value: _Intent.register, label: 'Criar conta'),
          ],
          onChanged: (v) => setState(() {
            _intent = v;
            _error = null;
          }),
        ),
        const SizedBox(height: 14),
        FinlyCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                isRegister ? 'Criar conta no Finly' : 'Entrar na sua conta',
                style:
                    const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 4),
              Text(
                isRegister
                    ? 'Crie sua conta para sincronizar transações, metas e resumo financeiro.'
                    : 'Acesse sua conta para sincronizar transações, metas e resumo financeiro.',
                style:
                    TextStyle(fontSize: 12.5, color: context.mutedForeground),
              ),
              const SizedBox(height: 16),
              if (isRegister) ...[
                LabeledField(
                  label: 'Nome',
                  child: AppTextField(
                    controller: _name,
                    hint: 'Seu nome',
                    textInputAction: TextInputAction.next,
                    autofillHints: const [AutofillHints.name],
                  ),
                ),
                const SizedBox(height: 14),
              ],
              LabeledField(
                label: 'E-mail',
                child: AppTextField(
                  controller: _email,
                  hint: 'voce@finly.app',
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  autofillHints: const [AutofillHints.email],
                ),
              ),
              const SizedBox(height: 14),
              LabeledField(
                label: 'Senha',
                child: AppTextField(
                  controller: _password,
                  hint: isRegister ? 'Crie uma senha' : 'Digite sua senha',
                  obscureText: !_showPassword,
                  textInputAction: TextInputAction.done,
                  onSubmitted: (_) => _submit(),
                  autofillHints: [
                    isRegister
                        ? AutofillHints.newPassword
                        : AutofillHints.password,
                  ],
                  suffixIcon: IconButton(
                    icon: Icon(_showPassword
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined),
                    onPressed: () =>
                        setState(() => _showPassword = !_showPassword),
                  ),
                ),
              ),
              if (isRegister)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: PasswordStrengthBar(password: _passwordValue),
                ),
              if (_error != null) ...[
                const SizedBox(height: 14),
                ErrorBanner(_error!),
              ],
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: isSubmitting ? null : _submit,
                  child: Text(
                    isSubmitting
                        ? (isRegister ? 'Criando conta...' : 'Entrando...')
                        : (isRegister ? 'Criar conta' : 'Entrar'),
                  ),
                ),
              ),
              const SizedBox(height: 10),
              Text(
                isRegister
                    ? 'Sua sessão será criada automaticamente após o cadastro.'
                    : 'Seu acesso fica salvo com segurança neste aparelho.',
                style: TextStyle(
                    fontSize: 11.5, color: context.mutedForeground),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
