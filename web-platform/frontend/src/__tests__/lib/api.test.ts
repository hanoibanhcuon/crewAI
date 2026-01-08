import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock axios
vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    })),
  },
}));

describe("API Configuration", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("should have agents API methods", async () => {
    const { agentsApi } = await import("@/lib/api");

    expect(agentsApi).toBeDefined();
    expect(typeof agentsApi.list).toBe("function");
    expect(typeof agentsApi.get).toBe("function");
    expect(typeof agentsApi.create).toBe("function");
    expect(typeof agentsApi.update).toBe("function");
    expect(typeof agentsApi.delete).toBe("function");
  });

  it("should have tasks API methods", async () => {
    const { tasksApi } = await import("@/lib/api");

    expect(tasksApi).toBeDefined();
    expect(typeof tasksApi.list).toBe("function");
    expect(typeof tasksApi.get).toBe("function");
    expect(typeof tasksApi.create).toBe("function");
    expect(typeof tasksApi.update).toBe("function");
    expect(typeof tasksApi.delete).toBe("function");
  });

  it("should have crews API methods", async () => {
    const { crewsApi } = await import("@/lib/api");

    expect(crewsApi).toBeDefined();
    expect(typeof crewsApi.list).toBe("function");
    expect(typeof crewsApi.get).toBe("function");
    expect(typeof crewsApi.create).toBe("function");
    expect(typeof crewsApi.kickoff).toBe("function");
    expect(typeof crewsApi.deploy).toBe("function");
  });

  it("should have flows API methods", async () => {
    const { flowsApi } = await import("@/lib/api");

    expect(flowsApi).toBeDefined();
    expect(typeof flowsApi.list).toBe("function");
    expect(typeof flowsApi.get).toBe("function");
    expect(typeof flowsApi.create).toBe("function");
    expect(typeof flowsApi.deploy).toBe("function");
  });

  it("should have tools API methods", async () => {
    const { toolsApi } = await import("@/lib/api");

    expect(toolsApi).toBeDefined();
    expect(typeof toolsApi.list).toBe("function");
    expect(typeof toolsApi.get).toBe("function");
    expect(typeof toolsApi.create).toBe("function");
    expect(typeof toolsApi.test).toBe("function");
  });

  it("should have knowledge API methods", async () => {
    const { knowledgeApi } = await import("@/lib/api");

    expect(knowledgeApi).toBeDefined();
    expect(typeof knowledgeApi.list).toBe("function");
    expect(typeof knowledgeApi.get).toBe("function");
    expect(typeof knowledgeApi.create).toBe("function");
    expect(typeof knowledgeApi.delete).toBe("function");
  });

  it("should have executions API methods", async () => {
    const { executionsApi } = await import("@/lib/api");

    expect(executionsApi).toBeDefined();
    expect(typeof executionsApi.list).toBe("function");
    expect(typeof executionsApi.get).toBe("function");
    expect(typeof executionsApi.getLogs).toBe("function");
    expect(typeof executionsApi.getTraces).toBe("function");
    expect(typeof executionsApi.cancel).toBe("function");
    expect(typeof executionsApi.submitFeedback).toBe("function");
  });

  it("should have triggers API methods", async () => {
    const { triggersApi } = await import("@/lib/api");

    expect(triggersApi).toBeDefined();
    expect(typeof triggersApi.list).toBe("function");
    expect(typeof triggersApi.get).toBe("function");
    expect(typeof triggersApi.create).toBe("function");
    expect(typeof triggersApi.update).toBe("function");
    expect(typeof triggersApi.delete).toBe("function");
  });

  it("should have templates API methods", async () => {
    const { templatesApi } = await import("@/lib/api");

    expect(templatesApi).toBeDefined();
    expect(typeof templatesApi.list).toBe("function");
    expect(typeof templatesApi.get).toBe("function");
    expect(typeof templatesApi.use).toBe("function");
    expect(typeof templatesApi.rate).toBe("function");
  });

  it("should have users API methods", async () => {
    const { usersApi } = await import("@/lib/api");

    expect(usersApi).toBeDefined();
    expect(typeof usersApi.getProfile).toBe("function");
    expect(typeof usersApi.updateProfile).toBe("function");
    expect(typeof usersApi.changePassword).toBe("function");
    expect(typeof usersApi.getApiKeys).toBe("function");
    expect(typeof usersApi.setApiKey).toBe("function");
  });
});
