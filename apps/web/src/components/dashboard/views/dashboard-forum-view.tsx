"use client";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ForumAdminPanel } from "@/components/dashboard/forum/forum-admin-panel";
import { TopicDetail } from "@/components/dashboard/forum/topic-detail";
import { TopicForm } from "@/components/dashboard/forum/topic-form";
import { TopicList } from "@/components/dashboard/forum/topic-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForum } from "@/hooks/use-forum";

export function DashboardForumView() {
  const {
    topics,
    isLoaded,
    selectedTopic,
    isSubmitting,
    openTopic,
    closeTopic,
    submitTopic,
    isAdmin,
    adminTopics,
    adminStatusFilter,
    setAdminStatusFilter,
    setTopicStatus,
    replyAsAdmin,
    isAuthenticated,
    sessionName,
    sessionEmail,
  } = useForum();

  if (selectedTopic) {
    return (
      <div className="space-y-6 2xl:space-y-8">
        <DashboardPageHeader
          title="Fórum"
          description="Dúvidas, reclamações e sugestões da comunidade Finly."
        />
        <TopicDetail topic={selectedTopic} onBack={closeTopic} />
      </div>
    );
  }

  return (
    <div className="space-y-6 2xl:space-y-8">
      <DashboardPageHeader
        title="Fórum"
        description="Dúvidas, reclamações e sugestões da comunidade Finly."
      />

      {isAdmin && adminTopics ? (
        <ForumAdminPanel
          topics={adminTopics}
          statusFilter={adminStatusFilter}
          onChangeFilter={setAdminStatusFilter}
          onApprove={(id) => setTopicStatus(id, "Published")}
          onHide={(id) => setTopicStatus(id, "Hidden")}
          onReply={replyAsAdmin}
          onOpenTopic={openTopic}
        />
      ) : null}

      <section className="grid gap-6 2xl:grid-cols-[minmax(360px,420px)_minmax(0,1fr)] 2xl:items-start">
        <aside className="min-w-0 2xl:sticky 2xl:top-24">
          {isAuthenticated ? (
            <TopicForm
              key={sessionEmail}
              isSubmitting={isSubmitting}
              authorName={sessionName}
              authorEmail={sessionEmail}
              onSubmit={submitTopic}
            />
          ) : (
            <Card className="rounded-[1.5rem] border-border/60 bg-card/95 shadow-sm">
              <CardHeader className="space-y-1 pb-2">
                <CardTitle className="text-xl font-semibold tracking-tight">
                  Entre para publicar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Só quem tem uma conta no Finly pode criar tópicos. Abra a área{" "}
                  <strong className="text-foreground">Conta</strong> pelo ícone no header
                  para entrar ou criar a sua.
                </p>
              </CardContent>
            </Card>
          )}
        </aside>

        <div className="min-w-0 space-y-5">
          {isLoaded ? (
            <TopicList topics={topics} onOpenTopic={openTopic} />
          ) : (
            <p className="text-sm text-muted-foreground">Carregando tópicos...</p>
          )}
        </div>
      </section>
    </div>
  );
}
