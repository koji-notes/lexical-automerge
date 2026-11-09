import { describe, expect, it } from "vitest";
import packageJson from "../package.json";

describe("package contract", () => {
  it("publishes hardened export paths and peer dependencies", () => {
    expect(packageJson.exports).toHaveProperty("./presence");
    expect(packageJson.exports).toHaveProperty("./testing");
    expect(packageJson.exports).toHaveProperty("./package.json");
    expect(packageJson.peerDependencies.lexical).toBe(">=0.53.0");
    expect(packageJson.peerDependenciesMeta["@lexical/react"].optional).toBe(true);
    expect(packageJson.peerDependenciesMeta.react.optional).toBe(true);
    expect(packageJson).not.toHaveProperty("dependencies");
    expect(packageJson.sideEffects).toBe(false);
  });
});
