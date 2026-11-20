import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { DashboardForumView } from "@/components/dashboard/views/dashboard-forum-view";

const topic = { id: "qa-topic", title: "Tópico de teste", authorName: "QA", status: "Published", moderationReason: null, replyCount: 0, createdAt: "2026-11-20T12:00:00Z" };
beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

it("shows a failed topic request instead of a misleading empty forum and recovers with retry", async () => {
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ message: "Fórum temporariamente indisponível" }), { status: 500 }))
    .mockResolvedValueOnce(new Response(JSON.stringify([topic]))));
  render(<DashboardForumView />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Fórum temporariamente indisponível");
  expect(screen.queryByText(/Nenhum tópico por aqui/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(await screen.findByRole("heading", { name: topic.title })).toBeVisible();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("shows topic detail errors and allows retry by opening the same topic again", async () => {
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify([topic])))
    .mockResolvedValueOnce(new Response(JSON.stringify({ message: "Não foi possível abrir o tópico" }), { status: 500 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ ...topic, body: "Conteúdo recuperado", replies: [] }))));
  render(<DashboardForumView />);
  fireEvent.click(await screen.findByRole("button", { name: /Tópico de teste/ }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível abrir o tópico");
  fireEvent.click(screen.getByRole("button", { name: /Tópico de teste/ }));
  expect(await screen.findByText("Conteúdo recuperado")).toBeVisible();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("confirms a successfully created topic even if refreshing the list then fails", async () => {
  localStorage.setItem("finly:auth-session", JSON.stringify({ requiresVerification: false, token: "synthetic-test", expiresAt: new Date(Date.now() + 3600000).toISOString(), userId: "qa-user", name: "QA", email: "qa@example.invalid" }));
  let created = false;
  vi.stubGlobal("fetch", vi.fn(async (url: string, options?: RequestInit) => {
    if (url.includes("/admin/")) return new Response("", { status: 403 });
    if (options?.method === "POST") {
      created = true;
      return new Response(JSON.stringify({ ...topic, body: "Descrição do teste", replies: [] }));
    }
    return created
      ? new Response(JSON.stringify({ message: "Falha ao atualizar a lista" }), { status: 500 })
      : new Response("[]");
  }));
  render(<DashboardForumView />);
  fireEvent.change(await screen.findByLabelText("Título"), { target: { value: "Novo tópico de teste" } });
  fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "Descrição do teste" } });
  fireEvent.click(screen.getByRole("button", { name: "Publicar tópico" }));
  expect(await screen.findByText("Tópico publicado! Já aparece na lista abaixo.")).toBeVisible();
  expect(await screen.findByRole("alert")).toHaveTextContent("Falha ao atualizar a lista");
  expect(screen.getByLabelText("Título")).toHaveValue("");
  expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeVisible();
});
