import { describe, it, expect, vi } from "vitest";
import Typesense from "typesense";

import getTypesenseClient from "./typesense";

vi.mock("typesense", () => ({
  __esModule: true,
  default: {
    Client: vi.fn(),
  },
}));

describe("getTypesenseClient", () => {
  const apiKey = "test-api-key";
  const host = "https://example.a1.typesense.net:443/path";

  it("should create a Typesense client with the correct configuration", () => {
    const expectedConfig = {
      nodes: [
        {
          host: "example.a1.typesense.net",
          path: "/path",
          port: 443,
          protocol: "https",
        },
      ],
      apiKey: apiKey,
      connectionTimeoutSeconds: 2,
    };

    getTypesenseClient(apiKey, host);

    expect(Typesense.Client).toHaveBeenCalledWith(expectedConfig);
  });

  it("should default to port 443 if no port is specified", () => {
    const hostWithoutPort = "https://example.a1.typesense.net/path";
    const expectedConfig = {
      nodes: [
        {
          host: "example.a1.typesense.net",
          path: "/path",
          port: 443,
          protocol: "https",
        },
      ],
      apiKey: apiKey,
      connectionTimeoutSeconds: 2,
    };

    getTypesenseClient(apiKey, hostWithoutPort);

    expect(Typesense.Client).toHaveBeenCalledWith(expectedConfig);
  });

  it("should use the specified port if provided", () => {
    const hostWithPort = "https://example.a1.typesense.net:1234/path";
    const expectedConfig = {
      nodes: [
        {
          host: "example.a1.typesense.net",
          path: "/path",
          port: 1234,
          protocol: "https",
        },
      ],
      apiKey: apiKey,
      connectionTimeoutSeconds: 2,
    };

    getTypesenseClient(apiKey, hostWithPort);

    expect(Typesense.Client).toHaveBeenCalledWith(expectedConfig);
  });
});