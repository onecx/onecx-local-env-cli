import { getSyncFileName } from "./naming";

describe("getSyncFileName", () => {
  test("returns productName_appName.json without a key", () => {
    expect(getSyncFileName("test", "onecx-mock")).toBe(
      "test_onecx-mock.json"
    );
  });

  test("returns productName_appName_key.json with a key", () => {
    expect(getSyncFileName("test", "onecx-mock", "shell-toast")).toBe(
      "test_onecx-mock_shell-toast.json"
    );
  });
});
