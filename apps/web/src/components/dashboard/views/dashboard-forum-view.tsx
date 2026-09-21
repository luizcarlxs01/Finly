"use client";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ForumAdminPanel } from "@/components/dashboard/forum/forum-admin-panel";
import { TopicDetail } from "@/components/dashboard/forum/topic-detail";
import { TopicForm } from "@/components/dashboard/forum/topic-form";
import { TopicList } from "@/components/dashboard/forum/topic-list";
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
          <TopicForm
            key={sessionEmail || "anon"}
            isSubmitting={isSubmitting}
            defaultName={sessionName}
            defaultEmail={sessionEmail}
            onSubmit={submitTopic}
          />
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
