import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { act } from "react";

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;
  options?: IntersectionObserverInit;
  observedElement: Element | null = null;
  observe = vi.fn((el: Element) => {
    this.observedElement = el;
  });
  unobserve = vi.fn();
  disconnect = vi.fn();

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.options = options;
    MockIntersectionObserver.instances.push(this);
  }

  trigger(isIntersecting: boolean) {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    );
  }
}

describe("useInView (IntersectionObserver supported)", () => {
  beforeEach(() => {
    MockIntersectionObserver.instances = [];
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("should start with inView false", async () => {
    const { useInView } = await import("../../hooks/useInView");

    function TestComponent() {
      const { ref, inView } = useInView();
      return <div ref={ref} data-testid="target">{inView ? "in" : "out"}</div>;
    }

    const { getByTestId } = render(<TestComponent />);
    expect(getByTestId("target").textContent).toBe("out");
  });

  it("should observe the element with the given threshold", async () => {
    const { useInView } = await import("../../hooks/useInView");

    function TestComponent() {
      const { ref } = useInView(0.5);
      return <div ref={ref} data-testid="target" />;
    }

    render(<TestComponent />);

    expect(MockIntersectionObserver.instances).toHaveLength(1);
    const instance = MockIntersectionObserver.instances[0];
    expect(instance.options).toEqual({ threshold: 0.5 });
    expect(instance.observe).toHaveBeenCalledTimes(1);
  });

  it("should set inView to true and unobserve when the element intersects", async () => {
    const { useInView } = await import("../../hooks/useInView");

    function TestComponent() {
      const { ref, inView } = useInView();
      return <div ref={ref} data-testid="target">{inView ? "in" : "out"}</div>;
    }

    const { getByTestId } = render(<TestComponent />);
    const instance = MockIntersectionObserver.instances[0];

    act(() => {
      instance.trigger(true);
    });

    expect(getByTestId("target").textContent).toBe("in");
    expect(instance.unobserve).toHaveBeenCalledTimes(1);
  });

  it("should NOT set inView when the element is not intersecting", async () => {
    const { useInView } = await import("../../hooks/useInView");

    function TestComponent() {
      const { ref, inView } = useInView();
      return <div ref={ref} data-testid="target">{inView ? "in" : "out"}</div>;
    }

    const { getByTestId } = render(<TestComponent />);
    const instance = MockIntersectionObserver.instances[0];

    act(() => {
      instance.trigger(false);
    });

    expect(getByTestId("target").textContent).toBe("out");
    expect(instance.unobserve).not.toHaveBeenCalled();
  });

  it("should disconnect the observer on unmount", async () => {
    const { useInView } = await import("../../hooks/useInView");

    function TestComponent() {
      const { ref } = useInView();
      return <div ref={ref} data-testid="target" />;
    }

    const { unmount } = render(<TestComponent />);
    const instance = MockIntersectionObserver.instances[0];

    unmount();

    expect(instance.disconnect).toHaveBeenCalledTimes(1);
  });

  it("should re-create the observer when threshold changes", async () => {
    const { useInView } = await import("../../hooks/useInView");

    function TestComponent({ threshold }: { threshold: number }) {
      const { ref } = useInView(threshold);
      return <div ref={ref} data-testid="target" />;
    }

    const { rerender } = render(<TestComponent threshold={0.1} />);
    expect(MockIntersectionObserver.instances).toHaveLength(1);

    rerender(<TestComponent threshold={0.9} />);

    expect(MockIntersectionObserver.instances).toHaveLength(2);
    expect(MockIntersectionObserver.instances[0].disconnect).toHaveBeenCalledTimes(1);
    expect(MockIntersectionObserver.instances[1].options).toEqual({ threshold: 0.9 });
  });
});

describe("useInView (IntersectionObserver NOT supported)", () => {
  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", undefined);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("should default inView to true and never construct an observer", async () => {
    vi.resetModules();
    const { useInView } = await import("../../hooks/useInView");

    function TestComponent() {
      const { ref, inView } = useInView();
      return <div ref={ref} data-testid="target">{inView ? "in" : "out"}</div>;
    }

    const { getByTestId } = render(<TestComponent />);
    expect(getByTestId("target").textContent).toBe("in");
  });
});