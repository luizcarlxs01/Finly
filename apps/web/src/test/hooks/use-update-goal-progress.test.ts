import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useUpdateGoalProgress } from "@/hooks/use-update-goal-progress";
import { useLocalGoals } from "@/hooks/use-local-goals";
import { useGoalsData } from "@/hooks/use-goals-data";
const state = vi.hoisted(() => ({ source: "local" }));
vi.mock("@/contexts/finance-source-context", () => ({ useFinanceSource: () => ({ source: state.source, isLoaded: true }) }));
vi.mock("@/hooks/use-auth-session", () => ({ useAuthSession: () => ({ session: { token: "test-token" } }) }));
const original = { id: "g1", title: "Reserva", currentAmount: 200, targetAmount: 1000, category: "general", deadline: "2026-12-20", createdAt: "2026-10-01T12:00:00Z" };
function useHarness() {
  const local = useLocalGoals();
  const data = useGoalsData({ localGoals: local });
  const write = useUpdateGoalProgress({ updateLocalGoalProgress: local.updateGoalProgress });
  return { data, write };
}
beforeEach(() => { localStorage.clear(); });
afterEach(() => { vi.unstubAllGlobals(); });
describe.each(["local", "api"])("substituição de progresso no modo %s", source => {
  it("substitui o valor, atualiza indicadores e recarrega o valor persistido sem alterar os demais campos", async () => {
    state.source = source;
    let persisted = { ...original, financialProfileId: "p1", status: "Active" };
    const fetchMock = vi.fn(async (input: string, init?: RequestInit) => {
      if (input.includes("/api/Profiles")) return new Response(JSON.stringify([{ id: "p1", isPrimary: true }]), { status: 200 });
      if (input.includes("/progress")) { persisted = { ...persisted, ...JSON.parse(String(init?.body)) }; return new Response(JSON.stringify(persisted), { status: 200 }); }
      return new Response(JSON.stringify([persisted]), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    localStorage.setItem("finly:local-goals", JSON.stringify([original]));
    const first = renderHook(useHarness);
    await waitFor(() => expect(first.result.current.data.goals[0]?.currentAmount).toBe(200));
    await act(async () => { await first.result.current.write.updateGoalProgress({ id: "g1", currentAmount: 80 }); });
    await waitFor(() => expect(first.result.current.data.goals[0]?.currentAmount).toBe(80));
    expect(first.result.current.data.totalGoalProgress).toBe(80);
    expect(first.result.current.data.remainingGoalAmount).toBe(920);
    expect(first.result.current.data.goals[0]).toMatchObject({ title: "Reserva", targetAmount: 1000, deadline: "2026-12-20" });
    if (source === "api") expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/api/Goals/g1/progress"), expect.objectContaining({ method: "PATCH", body: JSON.stringify({ currentAmount: 80 }), headers: expect.objectContaining({ Authorization: "Bearer test-token" }) }));
    else expect(fetchMock).not.toHaveBeenCalled();
    first.unmount();
    const reopened = renderHook(useHarness);
    await waitFor(() => expect(reopened.result.current.data.goals[0]?.currentAmount).toBe(80));
  });
  it("rejeita negativos e números não finitos sem persistir", async () => {
    state.source = source;
    const local = vi.fn(), fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useUpdateGoalProgress({ updateLocalGoalProgress: local }));
    for (const currentAmount of [-1, NaN, Infinity]) await act(async () => { await expect(result.current.updateGoalProgress({ id: "g1", currentAmount })).rejects.toThrow("valor atual válido"); });
    expect(local).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
it("mantém o erro da API sem disparar atualização de sucesso", async () => {
  state.source = "api";
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ message: "Falha ao salvar" }), { status: 500 })));
  const event = vi.fn();window.addEventListener("finly:goal-write-completed", event);
  const { result } = renderHook(() => useUpdateGoalProgress({ updateLocalGoalProgress: vi.fn() }));
  await act(async () => { await expect(result.current.updateGoalProgress({ id: "g1", currentAmount: 80 })).rejects.toThrow("Falha ao salvar"); });
  expect(event).not.toHaveBeenCalled();
  expect(result.current.errorMessage).toBe("Falha ao salvar");
  window.removeEventListener("finly:goal-write-completed", event);
});
