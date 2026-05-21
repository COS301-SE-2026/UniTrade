import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../../store/useAuthStore";

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null });
  });

  it("should start with no user", () => {
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("should set a buyer user correctly", () => {
    useAuthStore.getState().setUser({
      id: "1",
      name: "Tafadzwa Musiiwa",
      initials: "TM",
      role: "buyer",
    });

    const user = useAuthStore.getState().user;
    expect(user).not.toBeNull();
    expect(user?.name).toBe("Tafadzwa Musiiwa");
    expect(user?.role).toBe("buyer");
    expect(user?.initials).toBe("TM");
  });

  it("should set a seller user correctly", () => {
    useAuthStore.getState().setUser({
      id: "2",
      name: "Langa Vakalisa",
      initials: "LV",
      role: "seller",
    });

    expect(useAuthStore.getState().user?.role).toBe("seller");
  });

  it("should set an admin user correctly", () => {
    useAuthStore.getState().setUser({
      id: "3",
      name: "Admin User",
      initials: "AD",
      role: "admin",
    });

    expect(useAuthStore.getState().user?.role).toBe("admin");
  });

  it("should clear the user", () => {
    useAuthStore.getState().setUser({
      id: "1",
      name: "Tafadzwa Musiiwa",
      initials: "TM",
      role: "buyer",
    });

    useAuthStore.getState().clearUser();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("should overwrite an existing user when setUser is called again", () => {
    useAuthStore.getState().setUser({
      id: "1",
      name: "Tafadzwa Musiiwa",
      initials: "TM",
      role: "buyer",
    });

    useAuthStore.getState().setUser({
      id: "2",
      name: "Langa Vakalisa",
      initials: "LV",
      role: "seller",
    });

    const user = useAuthStore.getState().user;
    expect(user?.name).toBe("Langa Vakalisa");
    expect(user?.role).toBe("seller");
  });
});
