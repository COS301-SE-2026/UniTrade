import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../../store/useAuthStore";

describe("useAuthStore", () => {
beforeEach(() => {
  useAuthStore.setState({ user: null, pendingEmail: null, viewMode: "buyer" });
});

  it("should start with no user", () => {
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("should set a student user correctly", () => {
    useAuthStore.getState().setUser({
      id: "1",
      name: "Tafadzwa Musiiwa",
      initials: "TM",
      role: "student",
    });

    const user = useAuthStore.getState().user;
    expect(user).not.toBeNull();
    expect(user?.name).toBe("Tafadzwa Musiiwa");
    expect(user?.role).toBe("student");
    expect(user?.initials).toBe("TM");
  });

  it("should set a student user correctly", () => {
    useAuthStore.getState().setUser({
      id: "2",
      name: "Langa Vakalisa",
      initials: "LV",
      role: "student",
    });

    expect(useAuthStore.getState().user?.role).toBe("student");
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
      role: "student",
    });

    useAuthStore.getState().clearUser();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("should overwrite an existing user when setUser is called again", () => {
    useAuthStore.getState().setUser({
      id: "1",
      name: "Tafadzwa Musiiwa",
      initials: "TM",
      role: "student",
    });

    useAuthStore.getState().setUser({
      id: "2",
      name: "Langa Vakalisa",
      initials: "LV",
      role: "student",
    });

    const user = useAuthStore.getState().user;
    expect(user?.name).toBe("Langa Vakalisa");
    expect(user?.role).toBe("student");
  });


});

describe('pedingEmail actions', () => {
  it('should set a pending email', () => {
    useAuthStore.getState().setPendingEmail("test@up.ac.za");
    expect(useAuthStore.getState().pendingEmail).toBe("test@up.ac.za");
  });

  it('should clear a pending email',() => {
    useAuthStore.getState().setPendingEmail("test@up.ac.za");
    useAuthStore.getState().clearPendingEmail();
    expect(useAuthStore.getState().pendingEmail).toBeNull();
  });
});

describe('viewMode / toggleViewMode', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, viewMode: "buyer"});
  });

  it('should start with viewMode buyer', () => {
    expect(useAuthStore.getState().viewMode).toBe("buyer");
  });

  it('should toggle viewMode from buyer to seller for a student', () => {
    useAuthStore.getState().setUser({
      id: "1",
      name: "Tafadzwa Musiiwa",
      initials: "TM",
      role: "student",
    });

    useAuthStore.getState().toggleViewMode();
    expect(useAuthStore.getState().viewMode).toBe("seller");
  })

  it('should toggle viewMode back from seller to buyer for a student', () => {
    useAuthStore.getState().setUser({
      id: "1",
      name: "Tafadzwa Musiiwa",
      initials: "TM",
      role: "student",
    });

    useAuthStore.getState().toggleViewMode();
    useAuthStore.getState().toggleViewMode();
    expect(useAuthStore.getState().viewMode).toBe("buyer");
  });

  it('should not toggle viewMode for an admin user', () => {
    useAuthStore.getState().setUser({
      id: "3",
      name: "Admin User",
      initials: "AD",
      role: "admin",
    });

    useAuthStore.getState().toggleViewMode();
    expect(useAuthStore.getState().viewMode).toBe("buyer");
  });

  it('should not toggle viewMode when there is no user', () => {
    useAuthStore.getState().toggleViewMode();
    expect(useAuthStore.getState().viewMode).toBe("buyer");
  });

  it('should reset viewMode to buyer when clearUser is called after swithcing to seller', () => {
    useAuthStore.getState().setUser({
      id: "1",
      name: "Tafadzwa Musiiwa",
      initials: "TM",
      role: "student",
    });
    useAuthStore.getState().toggleViewMode();

    useAuthStore.getState().clearUser();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().viewMode).toBe("buyer");
  });
});
