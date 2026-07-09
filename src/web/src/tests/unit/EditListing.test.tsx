import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent} from "@testing-library/react";
import userEvent from "@testing-library/user-event"


const {
    getListingsCategories,
    getById,
    getCourse,
    updateListing,
    uploadImages,
    searchCourses,
    mockNavigate,
    routeParams,
} = vi.hoisted(() => ({
    getListingsCategories: vi.fn(),
    getCourse: vi.fn(),
    getById: vi.fn(),
    updateListing: vi.fn(),
    uploadImages: vi.fn(),
    searchCourses: vi.fn(),
    mockNavigate: vi.fn(),
    routeParams: {
        id: "123" as string | undefined
    },
}));

vi.mock("../../services/listingsService", () => ({
  listingsService: {
    getListingsCategories,
    getById,
    getCourse,
    searchCourses,
    updateListing,
    uploadImages,
  },
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useParams: () => ({ id: routeParams.id }),
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@tabler/icons-react", () => ({
    IconUpload: () => <svg data-testid="icon-upload" />,
    IconCheck: () => <svg data-testid="icon-check" />,
    IconX: () => <svg data-testid="icon-x" />,
}));

vi.mock("../../assets/bio-textbook.jpg", () => ({
    default: "bio-textbook-fallback.jpg",
}));

import EditListing from "../../pages/seller/EditListing";

const mockCategories = [
  { id: 1, name: "book" },
  { id: 2, name: "electronics" },
  { id: 3, name: "furniture" },
  { id: 4, name: "other" },
];

const baseListing = {
  title: "Intro to Economics Textbook",
  category: "book",
  description: "Barely used, no highlights.",
  price: 250,
  condition: "new",
  courseId: "1",
  courseCode: "301",
  images: [
    { id: "1", url: "https://example.com/img1.jpg" },
    { id: "2", url: "https://example.com/img2.jpg" },
  ],
};

function makeFile(name: string, sizeBytes: number, type="image/png") {
    const file = new File(["a"], name, { type });
    Object.defineProperty(file, "size", {value: sizeBytes});
    return file;
}

function getImageGrid(container: HTMLElement) {
    const grid = container.querySelector("div.grid.grid-cols-4");
    if (!grid) throw new Error("Image grid not found - check componet markup");
    return grid;
}

async function renderAndLoad(listingOverrides: Partial<typeof baseListing> = {}) {
    getListingsCategories.mockResolvedValue(mockCategories);

    const listing = { ...baseListing, ...listingOverrides};
    getById.mockResolvedValue(listing);

    getCourse.mockResolvedValue({
       courseId: listing.courseId,
       courseCode: listing.courseCode,
       courseName: "Mock Course",
       faculty: "Mock Faculty",
    })
    const rendered = render(<EditListing />);
    await waitFor(() =>
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument(),
);

return rendered;
}

beforeEach(() => {
    vi.clearAllMocks();
    routeParams.id = "123";
    globalThis.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    globalThis.URL.revokeObjectURL = vi.fn();

    getCourse.mockResolvedValue({
      courseId: 0,
      courseCode: "",
      courseName: "",
      faculty: "",
    });
    searchCourses.mockResolvedValue([]);
});

afterEach(() => {
    vi.restoreAllMocks();
})

describe("Initial loding, data fethcing", () => {
    it ("shows a loading indicator while the api calls are pedning", async () =>  {
        let resolveGetById: (v: unknown) => void;
        getListingsCategories.mockResolvedValue(mockCategories);
        getById.mockImplementation(
            () => new Promise((res) => (resolveGetById = res)),
        );

        render(<EditListing />);

        expect(screen.getByText(/loading/i)).toBeInTheDocument();
        resolveGetById!(baseListing);
        await waitFor(() => 
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument(),
    );
    });

it("renders the form pre-filled once both calls resolve", async () => {
    await renderAndLoad();

    expect(screen.getByDisplayValue(baseListing.title)).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(baseListing.description),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue(String(baseListing.price))).toBeInTheDocument();
  });

  it("sets an error message if getListingsCategories fails", async () => {
    getListingsCategories.mockRejectedValue(new Error("network error"));
    getById.mockResolvedValue(baseListing);

    render(<EditListing />);

    await waitFor(() =>
      expect(screen.getByText(/failed to load categories/i)).toBeInTheDocument(),
    );
  });

  it("sets an error message if getById fails", async () => {
    getListingsCategories.mockResolvedValue(mockCategories);
    getById.mockRejectedValue(new Error("not found"));

    render(<EditListing />);

    await waitFor(() =>
      expect(screen.getByText(/failed to load listing/i)).toBeInTheDocument(),
    );
    // loading must still clear even on failure, since it's set in .finally
    expect(screen.queryByText(/^loading/i)).not.toBeInTheDocument();
  });

  it("falls back to condition 'Good' when API condition is unrecognized", async () => {
    await renderAndLoad({ condition: "some-unknown-value" });

    const goodButton = screen.getByRole("button", { name: /^good$/i });
    expect(goodButton.className).toMatch(/bg-\[#0F2D5E\]/);
  });

  it("populates the course input from the resolved course code on load", async () => {
   
    await renderAndLoad()

    const courseInput = screen.getByPlaceholderText(/module \(e\.g\. cos110\)/i);
    await waitFor(() => expect(courseInput).toHaveValue(baseListing.courseCode));
  });

  it("defaults the course input to empty string when courseCode is missing", async () => {
    await renderAndLoad({ courseCode: undefined as unknown as string });
    const courseInput = screen.getByPlaceholderText(/module \(e\.g\. cos110\)/i);
    await waitFor(() => expect(courseInput).toHaveValue(""));
  });
});
describe("Category-dependent fields", () => {
  it("shows the moduleTag dropdown when category is 'book'", async () => {
    await renderAndLoad({ category: "book" });
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("shows the Brand/Model field when category is 'electronics'", async () => {
    await renderAndLoad({ category: "electronics" });
    expect(screen.getByPlaceholderText(/brand\/model/i)).toBeInTheDocument();
  });

  it("shows the Dimensions field when category is 'furniture'", async () => {
    await renderAndLoad({ category: "furniture" });
    expect(screen.getByPlaceholderText(/dimensions/i)).toBeInTheDocument();
  });

  it("shows neither extra field when category is 'other'", async () => {
    await renderAndLoad({ category: "other" });
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/brand\/model/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/dimensions/i)).not.toBeInTheDocument();
  });

  it("swaps fields when the category selection changes", async () => {
    const user = userEvent.setup();
    await renderAndLoad({ category: "book" });

    expect(screen.getByRole("combobox")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^electronics$/i }));

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText(/brand\/model/i)).toBeInTheDocument();
  });
});
describe("Form field bindings", () => {
  it("updates title on typing", async () => {
    const user = userEvent.setup();
    await renderAndLoad();

    const titleInput = screen.getByDisplayValue(baseListing.title);
    await user.clear(titleInput);
    await user.type(titleInput, "New Title");

    expect(screen.getByDisplayValue("New Title")).toBeInTheDocument();
  });

  it("updates description on typing", async () => {
    const user = userEvent.setup();
    await renderAndLoad();

    const desc = screen.getByDisplayValue(baseListing.description);
    await user.clear(desc);
    await user.type(desc, "Updated description");

    expect(screen.getByDisplayValue("Updated description")).toBeInTheDocument();
  });

  it("updates price on typing", async () => {
    const user = userEvent.setup();
    await renderAndLoad();

    const price = screen.getByDisplayValue(String(baseListing.price));
    await user.clear(price);
    await user.type(price, "999");

    expect(screen.getByDisplayValue("999")).toBeInTheDocument();
  });

  it("updates condition when a different condition button is clicked", async () => {
    const user = userEvent.setup();
    await renderAndLoad();

    const fairButton = screen.getByRole("button", { name: /^fair$/i });
    await user.click(fairButton);

    expect(fairButton.className).toMatch(/bg-\[#0F2D5E\]/);
  });

  it("updates category when a category button is clicked", async () => {
    const user = userEvent.setup();
    await renderAndLoad({ category: "other" });

    const furnitureButton = screen.getByRole("button", { name: /^furniture$/i });
    await user.click(furnitureButton);

    expect(furnitureButton.className).toMatch(/bg-\[#0F2D5E\]/);
    expect(screen.getByPlaceholderText(/dimensions/i)).toBeInTheDocument();
  });

  it("updates the course input value when the user types a new module code", async () => {
    const user = userEvent.setup();
    searchCourses.mockResolvedValue([
      { courseId: 114, courseCode: "WTW114", courseName: "Calculus", faculty: "Science"},
    ]);


    await renderAndLoad({ category: "book", courseCode: ""});
    const courseInput = screen.getByPlaceholderText(/module \(e\.g\. cos110\)/i);

    await user.clear(courseInput)
    await user.type(courseInput, "WTW114");

    await waitFor(() => expect(courseInput).toHaveValue("WTW114"))
  });

  it("updates customField when typing in Brand/Model", async () => {
    const user = userEvent.setup();
    await renderAndLoad({ category: "electronics" });

    const customField = screen.getByPlaceholderText(/brand\/model/i);
    await user.type(customField, "Samsung Galaxy");

    expect(screen.getByDisplayValue("Samsung Galaxy")).toBeInTheDocument();
  });
});
describe("Existing image management", () => {
  it("renders all existing images from data.images", async () => {
    const { container } = await renderAndLoad();

    const grid = getImageGrid(container);
    const imgs = Array.from(grid.querySelectorAll("img")).filter((el) =>
      (el as HTMLImageElement).src.includes("example.com"),
    );
    expect(imgs).toHaveLength(baseListing.images.length);
  });

  it("uses the fallback image when an existing image lacks a url", async () => {
    const { container } = await renderAndLoad({
      images: [{ id: "9", url: "" } as unknown as { id: string; url: string }],
    });

    const grid = getImageGrid(container);
    const img = grid.querySelector("img") as HTMLImageElement;
    expect(img.src).toContain("bio-textbook-fallback.jpg");
  });

  it("removes an existing image and tracks their ids ", async () => {
    const user = userEvent.setup();
    updateListing.mockResolvedValue(undefined);
    const { container } = await renderAndLoad();

    const grid = getImageGrid(container);
    const removeButtonsBefore = Array.from(
      grid.querySelectorAll("button"),
    ).filter((b) => b.getAttribute("aria-label") === "Remove image");
    expect(removeButtonsBefore).toHaveLength(baseListing.images.length);

    await user.click(removeButtonsBefore[0]);
    const removeButtonsAfter = Array.from(
      grid.querySelectorAll("button"),
    ).filter((b) => b.getAttribute("aria-label") === "Remove image");
    expect(removeButtonsAfter).toHaveLength(baseListing.images.length - 1);

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(updateListing).toHaveBeenCalled());
    const payload = updateListing.mock.calls[0][1];
    expect(payload.removedImageIds).toEqual([1]);
  });

  it("accumulates multiple removed image ids", async () => {
    const user = userEvent.setup();
    updateListing.mockResolvedValue(undefined);
    const { container } = await renderAndLoad();

    const grid = getImageGrid(container);
    let removeButtons = Array.from(grid.querySelectorAll("button")).filter(
      (b) => b.getAttribute("aria-label") === "Remove image",
    );
    await user.click(removeButtons[0]);

    removeButtons = Array.from(grid.querySelectorAll("button")).filter(
      (b) => b.getAttribute("aria-label") === "Remove image",
    );
    await user.click(removeButtons[0]);

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(updateListing).toHaveBeenCalled());
    const payload = updateListing.mock.calls[0][1];
    expect(payload.removedImageIds.sort()).toEqual([1, 2]);
  });
});
describe("New file uploads", () => {
  function getHiddenFileInput(container: HTMLElement) {
    return container.querySelector('input[type="file"]') as HTMLInputElement;
  }

  it("clicking an empty slot triggers the input", async () => {
    const user = userEvent.setup();
    const { container } = await renderAndLoad();

    const fileInput = getHiddenFileInput(container);
    const clickSpy = vi.spyOn(fileInput, "click");

    const slotButtons = screen.getAllByRole("button").filter(
      (b) => b.querySelector('[data-testid="icon-upload"]') !== null,
    );
    await user.click(slotButtons[0]);

    expect(clickSpy).toHaveBeenCalled();
  });

  it("adds files under the size limit and poreviews are shown", async () => {
    const { container } = await renderAndLoad();

    const fileInput = getHiddenFileInput(container);
    const file = makeFile("photo.png", 1024 * 1024); // 1MB

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const grid = getImageGrid(container);
      const previews = Array.from(grid.querySelectorAll("img")).filter((el) =>
        (el as HTMLImageElement).src.includes("blob:mock-url"),
      );
      expect(previews.length).toBe(1);
    });
    expect(globalThis.URL.createObjectURL).toHaveBeenCalledWith(file);
  });

  it("rejects files with a size more than 10 MB", async () => {
    const { container } = await renderAndLoad();

    const fileInput = getHiddenFileInput(container);
    const bigFile = makeFile("huge.png", 11 * 1024 * 1024);

    fireEvent.change(fileInput, { target: { files: [bigFile] } });

    await waitFor(() =>
      expect(screen.getByText(/exceed the 10mb limit/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/huge\.png/)).toBeInTheDocument();
    expect(fileInput.value).toBe("");
  });

  it("only accepts new immages up to the remaining parts of teh grid ", async () => {
    const { container } = await renderAndLoad();

    const fileInput = getHiddenFileInput(container);
    const files = [
      makeFile("a.png", 1000),
      makeFile("b.png", 1000),
      makeFile("c.png", 1000),
    ];

    fireEvent.change(fileInput, { target: { files } });

    await waitFor(() => {
      const grid = getImageGrid(container);
      const previews = Array.from(grid.querySelectorAll("img")).filter((el) =>
        (el as HTMLImageElement).src.includes("blob:mock-url"),
      );
      expect(previews.length).toBe(2);
    });
  });

  it("removes a new file preview when delete button id used", async () => {
    const { container } = await renderAndLoad();
    const user = userEvent.setup();

    const fileInput = getHiddenFileInput(container);
    fireEvent.change(fileInput, { target: { files: [makeFile("x.png", 1000)] } });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /remove new image/i })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: /remove new image/i }));

    expect(screen.queryByRole("button", { name: /remove new image/i })).not.toBeInTheDocument();
  });

  it("shows no empty upload slots once MAX_IMAGES is reached", async () => {
    const { container } = await renderAndLoad();

    const fileInput = getHiddenFileInput(container);
    fireEvent.change(fileInput, {
      target: { files: [makeFile("a.png", 1000), makeFile("b.png", 1000)] },
    });

    await waitFor(() => {
      const slotButtons = screen.queryAllByRole("button").filter(
        (b) => b.querySelector('[data-testid="icon-upload"]') !== null,
      );
      expect(slotButtons.length).toBe(0);
    });
  });
});
describe("Save flow", () => {
  it("calls updateListing with the correctly mapped payload", async () => {
    const user = userEvent.setup();
    updateListing.mockResolvedValue(undefined);
      searchCourses.mockResolvedValue([
    { courseId: 301, courseCode: "301", courseName: "Mock Course 301", faculty: "Mock" },
  ]);

    await renderAndLoad({ category: "book", courseCode: "301" });

    await waitFor(() => 
    expect(screen.getByText(/module selected/i)).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(updateListing).toHaveBeenCalledTimes(1));
    const [calledId, payload] = updateListing.mock.calls[0];

    expect(calledId).toBe("123");
    expect(payload).toMatchObject({
      title: baseListing.title,
      description: baseListing.description,
      price: baseListing.price,
      categoryName: "book",
      courseId: 301,
      removedImageIds: [],
    });
    expect(payload.condition).toBe("new");
  });

  it("maps condition Worn back to 'poor' on save", async () => {
    const user = userEvent.setup();
    updateListing.mockResolvedValue(undefined);
    await renderAndLoad({ condition: "poor" });

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(updateListing).toHaveBeenCalled());
    expect(updateListing.mock.calls[0][1].condition).toBe("poor");
  });

  it("sets courseId to null when category is not 'book'", async () => {
    const user = userEvent.setup();
    updateListing.mockResolvedValue(undefined);
    await renderAndLoad({ category: "electronics", courseCode: "301" });

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(updateListing).toHaveBeenCalled());
    expect(updateListing.mock.calls[0][1].courseId).toBeNull();
  });

  it("sets courseId to null when category is 'book' but moduleTag is empty", async () => {
    const user = userEvent.setup();
    updateListing.mockResolvedValue(undefined);
    await renderAndLoad({ category: "book", courseCode: "" });

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(updateListing).toHaveBeenCalled());
    expect(updateListing.mock.calls[0][1].courseId).toBeNull();
  });

  it("parses courseId to an integer when moduleTag is a numeric string", async () => {
    const user = userEvent.setup();
    updateListing.mockResolvedValue(undefined);

    searchCourses.mockResolvedValue([
      { courseId: 114, courseCode: "114", courseName: "Mock Course 114", faculty: "Mock"},
    ]);

    await renderAndLoad({ category: "book", courseCode: "114" });
    
    await waitFor(() =>
    expect(screen.getByText(/module selected/i)).toBeInTheDocument(),
  );
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(updateListing).toHaveBeenCalled());
    expect(updateListing.mock.calls[0][1].courseId).toBe(114);
  });

  it("converts price to a number before sending", async () => {
    const user = userEvent.setup();
    updateListing.mockResolvedValue(undefined);
    await renderAndLoad();

    const priceInput = screen.getByDisplayValue(String(baseListing.price));
    await user.clear(priceInput);
    await user.type(priceInput, "500");

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(updateListing).toHaveBeenCalled());
    const price = updateListing.mock.calls[0][1].price;
    expect(price).toBe(500);
    expect(typeof price).toBe("number");
  });

  it("calls uploadImages after updateListing when new files were added", async () => {
    updateListing.mockResolvedValue(undefined);
    uploadImages.mockResolvedValue(undefined);
    const { container } = await renderAndLoad();

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = makeFile("new.png", 1000);
    fireEvent.change(fileInput, { target: { files: [file] } });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(uploadImages).toHaveBeenCalledTimes(1));
    expect(uploadImages).toHaveBeenCalledWith("123", [file]);

    const updateOrder = updateListing.mock.invocationCallOrder[0];
    const uploadOrder = uploadImages.mock.invocationCallOrder[0];
    expect(updateOrder).toBeLessThan(uploadOrder);
  });

  it("does not call uploadImages when there are no new files", async () => {
    const user = userEvent.setup();
    updateListing.mockResolvedValue(undefined);
    await renderAndLoad();

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(updateListing).toHaveBeenCalled());
    expect(uploadImages).not.toHaveBeenCalled();
  });

  it("navigates to /seller/listings on successful save", async () => {
    const user = userEvent.setup();
    updateListing.mockResolvedValue(undefined);
    await renderAndLoad();

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/seller/listings"),
    );
  });

  it("shows an error and stops saving when updateListing rejects", async () => {
    const user = userEvent.setup();
    updateListing.mockRejectedValue(new Error("server error"));
    await renderAndLoad();

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(screen.getByText(/failed to save changes/i)).toBeInTheDocument(),
    );
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /save changes/i })).not.toBeDisabled();
  });

  it("shows an error when uploadImages rejects after a successful updateListing", async () => {
    updateListing.mockResolvedValue(undefined);
    uploadImages.mockRejectedValue(new Error("upload failed"));
    const { container } = await renderAndLoad();

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [makeFile("x.png", 1000)] } });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(screen.getByText(/failed to save changes/i)).toBeInTheDocument(),
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("disables the save button and shows 'Saving...' while the save is in flight", async () => {
    let resolveUpdate: (v: unknown) => void;
    updateListing.mockImplementation(
      () => new Promise((res) => (resolveUpdate = res)),
    );
    const user = userEvent.setup();
    await renderAndLoad();

    const saveButton = screen.getByRole("button", { name: /save changes/i });
    await user.click(saveButton);

    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();

    resolveUpdate!(undefined);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
  });

  it("does nothing when id is undefined", async () => {
    routeParams.id = undefined;
    getListingsCategories.mockResolvedValue(mockCategories);

    render(<EditListing />);

    await waitFor(() => expect(getListingsCategories).toHaveBeenCalled());
    expect(getById).not.toHaveBeenCalled();
  });
});
describe("Cancel flow", () => {
  it("navigates back without saving when Cancel Changes is clicked", async () => {
    const user = userEvent.setup();
    await renderAndLoad();

    await user.click(screen.getByRole("button", { name: /cancel changes/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/seller/listings");
    expect(updateListing).not.toHaveBeenCalled();
  });
});

describe("Confirmation summary", () => {
  it("shows the first existing image and title in the summary", async () => {
    await renderAndLoad();
    expect(screen.getByText(baseListing.title)).toBeInTheDocument();
  });

  it("falls back to 'Untitled Listing' when title is cleared", async () => {
    const user = userEvent.setup();
    await renderAndLoad();

    const titleInput = screen.getByDisplayValue(baseListing.title);
    await user.clear(titleInput);

    expect(screen.getByText(/untitled listing/i)).toBeInTheDocument();
  });

  it("uses the first new preview in the summary when there are no existing images", async () => {
    const { container } = await renderAndLoad({ images: [] });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [makeFile("x.png", 1000)] } });

    await waitFor(() => {
     
      const grid = getImageGrid(container);
      const allImgs = Array.from(container.querySelectorAll("img"));
      const summaryImgs = allImgs.filter(
        (el) =>
          !grid.contains(el) &&
          (el as HTMLImageElement).src.includes("blob:mock-url"),
      );
      expect(summaryImgs.length).toBeGreaterThan(0);
    });
  });
});