import 'package:finly_mobile/app/theme.dart';
import 'package:finly_mobile/features/auth/data/auth_models.dart';
import 'package:finly_mobile/features/auth/state/auth_controller.dart';
import 'package:finly_mobile/features/forum/data/forum_models.dart';
import 'package:finly_mobile/features/forum/data/forum_repository.dart';
import 'package:finly_mobile/features/forum/ui/forum_screen.dart';
import 'package:finly_mobile/features/forum/ui/topic_detail_screen.dart';
import 'package:finly_mobile/features/forum/ui/topic_form_sheet.dart';
import 'package:finly_mobile/shared/models/enums.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';

class _FakeRepo implements ForumRepository {
  final created = <CreateTopicRequest>[];
  TopicStatus nextStatus = TopicStatus.published;

  final summaries = [
    TopicSummary(
        id: '1',
        title: 'Não consigo editar parcela',
        authorName: 'Maria',
        status: TopicStatus.pendingReview,
        moderationReason: 'Link suspeito',
        replyCount: 2,
        createdAt: DateTime(2026, 11, 20)),
    TopicSummary(
        id: '2',
        title: 'Sugestão de tema',
        authorName: 'João',
        status: TopicStatus.published,
        moderationReason: null,
        replyCount: 0,
        createdAt: DateTime(2026, 11, 21)),
  ];

  @override
  Future<List<TopicSummary>> getTopics() async => summaries;

  @override
  Future<List<TopicSummary>> getAdminTopics({TopicStatus? status}) async =>
      summaries;

  @override
  Future<TopicDetail> getTopic(String id) async => TopicDetail(
        id: id,
        title: 'Não consigo editar parcela',
        body: 'Descrição do problema',
        authorName: 'Maria',
        status: TopicStatus.published,
        moderationReason: null,
        createdAt: DateTime(2026, 11, 20, 14, 30),
        replies: [
          TopicReply(
              id: 'r1',
              body: 'Já corrigimos, atualize o app.',
              isFromAdmin: true,
              createdAt: DateTime(2026, 11, 21, 9, 5)),
        ],
      );

  @override
  Future<TopicDetail> createTopic(CreateTopicRequest request) async {
    created.add(request);
    return TopicDetail(
        id: '9',
        title: request.title,
        body: request.body,
        authorName: 'Maria',
        status: nextStatus,
        moderationReason: null,
        createdAt: DateTime(2026, 11, 26),
        replies: const []);
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => null;
}

class _FakeAuth extends AuthController {
  _FakeAuth(this.logged);
  final bool logged;

  @override
  AuthState build() => AuthState(
        isBootstrapping: false,
        session: logged
            ? AuthSession(
                token: 't',
                expiresAt: DateTime.now().add(const Duration(days: 1)),
                userId: 'u1',
                name: 'Maria Teste',
                email: 'maria@exemplo.com')
            : null,
      );
}

Widget _app(Widget home, _FakeRepo repo,
        {bool logged = true, bool scroll = false}) =>
    ProviderScope(
      overrides: [
        forumRepositoryProvider.overrideWithValue(repo),
        authControllerProvider.overrideWith(() => _FakeAuth(logged)),
      ],
      child: MaterialApp(
        theme: AppTheme.light(),
        home:
            scroll ? Scaffold(body: SingleChildScrollView(child: home)) : home,
      ),
    );

void main() {
  setUpAll(() => initializeDateFormatting('pt_BR'));

  testWidgets('formulário mostra autor da conta, valida e publica', (t) async {
    final repo = _FakeRepo();
    await t.pumpWidget(_app(const TopicForm(inline: true), repo, scroll: true));
    expect(find.text('Novo tópico'), findsOneWidget);
    expect(find.textContaining('Respondemos por aqui e por e-mail'),
        findsOneWidget);
    expect(find.text('Título'), findsOneWidget);
    expect(find.text('Descrição'), findsOneWidget);
    expect(
        find.textContaining('Maria Teste', findRichText: true), findsOneWidget);
    expect(find.textContaining('maria@exemplo.com', findRichText: true),
        findsOneWidget);

    await t.tap(find.text('Publicar tópico'));
    await t.pump();
    expect(find.text('Preencha todos os campos antes de publicar.'),
        findsOneWidget);

    await t.enterText(find.byType(TextField).at(0), 'Meu título');
    await t.enterText(find.byType(TextField).at(1), 'Meu corpo');
    await t.tap(find.text('Publicar tópico'));
    await t.pumpAndSettle();
    expect(repo.created.single.title, 'Meu título');
    expect(find.text('Tópico publicado! Já aparece na lista abaixo.'),
        findsOneWidget);
  });

  testWidgets('tópico sinalizado mostra aviso de aprovação', (t) async {
    final repo = _FakeRepo()..nextStatus = TopicStatus.pendingReview;
    await t.pumpWidget(_app(const TopicForm(inline: true), repo, scroll: true));
    await t.enterText(find.byType(TextField).at(0), 'a');
    await t.enterText(find.byType(TextField).at(1), 'b');
    await t.tap(find.text('Publicar tópico'));
    await t.pumpAndSettle();
    expect(find.textContaining('vai aparecer assim que for aprovado'),
        findsOneWidget);
  });

  testWidgets('detalhe mostra Resposta do Finly e voltar', (t) async {
    await t
        .pumpWidget(_app(const TopicDetailScreen(topicId: '1'), _FakeRepo()));
    await t.pumpAndSettle();
    expect(find.text('Voltar para o fórum'), findsOneWidget);
    expect(find.text('Não consigo editar parcela'), findsOneWidget);
    expect(find.text('Resposta do Finly'), findsOneWidget);
    expect(find.text('Já corrigimos, atualize o app.'), findsOneWidget);
    expect(find.textContaining('20/11/2026 14:30'), findsOneWidget);
  });

  testWidgets('fórum logado como admin mostra moderação e lista', (t) async {
    await t.pumpWidget(_app(const ForumScreen(), _FakeRepo()));
    await t.pumpAndSettle();
    expect(find.text('Moderação do fórum'), findsOneWidget);
    for (final f in ['Todos', 'Em análise', 'Publicados', 'Ocultos']) {
      expect(find.text(f), findsWidgets);
    }
    expect(find.text('Link suspeito'), findsWidgets);
    expect(find.text('Aprovar'), findsOneWidget);
    expect(find.text('Responder'), findsNWidgets(2));
    await t.tap(find.text('Responder').first);
    await t.pump();
    expect(find.text('Enviar resposta'), findsOneWidget);
    expect(find.text('Cancelar'), findsOneWidget);
  });

  testWidgets('deslogado vê Entre para publicar', (t) async {
    await t.pumpWidget(_app(const ForumScreen(), _FakeRepo(), logged: false));
    await t.pumpAndSettle();
    expect(find.text('Entre para publicar'), findsOneWidget);
    expect(find.text('Novo tópico'), findsNothing);
    expect(find.text('Publicado'), findsOneWidget);
  });
}
