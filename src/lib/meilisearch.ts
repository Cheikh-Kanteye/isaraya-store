import config from "@/config";
import { apiService } from "@/services/api";
import { instantMeiliSearch } from "@meilisearch/instant-meilisearch";

export const { searchClient } = instantMeiliSearch(
  config.meilisearch.host,
  config.meilisearch.apiKey
);

export const initializeMeilisearchIndex = async () => {
  try {
    const productsData = await apiService.products.getAll();
    const categorieData = await apiService.categories.getAll();
    const brandData = await apiService.brands.getAll();

    const flattenedProducts = productsData.map((product) => ({
      id: product.id,
      name: product.name,
      title: product.title,
      sku: product.sku,
      description: product.description,
      price: product.price,
      stock: product.stock,
      rating: product.rating,
      categoryId: product.categoryId,
      brandId: product.brandId,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      originalPrice: product.originalPrice,
      vendorId: product.vendorId,
      reports: product.reports,
      tags: product.tags,
      condition: product.condition,
      attributes: product.attributes,
      status: product.status,
      specifications: product.specifications,
      imageUrls: product.images.map((img) => img.url),
      categoryName: categorieData.find((c) => c.id === product.categoryId)
        ?.name,
      brandName: brandData.find((b) => b.id === product.brandId)?.name,
    }));

    await deleteIndexIfExists("products");
    await createIndex("products", "id");
    await addDocuments("products", flattenedProducts);
    await waitForTaskCompletion(
      await setSearchSettings("products", {
        filterableAttributes: [
          "brandId",
          "categoryId",
          "condition",
          "price",
          "tags",
          "categoryName",
          "brandName",
        ],
        rankingRules: [
          "words",
          "typo",
          "proximity",
          "attribute",
          "sort",
          "exactness",
        ],
        sortableAttributes: ["price", "createdAt"],
      })
    );
  } catch (error) {
    console.error("Error initializing Meilisearch product index:", error);
    throw error;
  }
};

export const initializeCategoriesIndex = async () => {
  try {
    const categories = await apiService.categories.getAll();
    const flattened = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description || "",
      imageUrl: c.imageUrl || "",
      parentId: c.parentId || null,
    }));

    await deleteIndexIfExists("categories");
    await createIndex("categories", "id");
    await addDocuments("categories", flattened);
    await waitForTaskCompletion(
      await setSearchSettings("categories", {
        filterableAttributes: ["parentId", "slug", "name"],
        rankingRules: [
          "words",
          "typo",
          "proximity",
          "attribute",
          "sort",
          "exactness",
        ],
        sortableAttributes: ["name"],
      })
    );
  } catch (error) {
    console.error("Error initializing Meilisearch categories index:", error);
    throw error;
  }
};

let indexEnsured = false;

export const ensureProductsIndex = async () => {
  if (indexEnsured) return;
  try {
    const res = await fetch(`${config.meilisearch.host}/indexes/products`, {
      headers: { Authorization: `Bearer ${config.meilisearch.apiKey}` },
    });
    if (res.status === 404) {
      console.warn("Meilisearch index 'products' not found. Initializing...");
      await initializeMeilisearchIndex();
    }
    indexEnsured = true;
  } catch (e) {
    console.error("Failed to verify Meilisearch products index:", e);
  }
};

export const ensureCategoriesIndex = async () => {
  try {
    const res = await fetch(`${config.meilisearch.host}/indexes/categories`, {
      headers: { Authorization: `Bearer ${config.meilisearch.apiKey}` },
    });
    if (res.status === 404) {
      console.warn("Meilisearch index 'categories' not found. Initializing...");
      await initializeCategoriesIndex();
    }
  } catch (e) {
    console.error("Failed to verify Meilisearch categories index:", e);
  }
};

// Helpers
async function deleteIndexIfExists(uid: string) {
  const resp = await fetch(`${config.meilisearch.host}/indexes/${uid}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${config.meilisearch.apiKey}` },
  });
  if (resp.ok) return;
  if (resp.status !== 404) {
    const data = await resp.json();
    throw new Error(`Failed to delete index ${uid}: ${JSON.stringify(data)}`);
  }
}

async function createIndex(uid: string, primaryKey: string) {
  const resp = await fetch(`${config.meilisearch.host}/indexes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.meilisearch.apiKey}`,
    },
    body: JSON.stringify({ uid, primaryKey }),
  });
  if (!resp.ok) {
    const data = await resp.json();
    throw new Error(`Failed to create index ${uid}: ${JSON.stringify(data)}`);
  }
}

async function addDocuments(uid: string, docs: unknown[]) {
  const resp = await fetch(
    `${config.meilisearch.host}/indexes/${uid}/documents`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.meilisearch.apiKey}`,
      },
      body: JSON.stringify(docs),
    }
  );
  const data = await resp.json();
  if (!resp.ok)
    throw new Error(
      `Failed to add documents to ${uid}: ${JSON.stringify(data)}`
    );
  await waitForTaskCompletion(data);
}

async function setSearchSettings(
  uid: string,
  settings: Record<string, unknown>
) {
  const resp = await fetch(
    `${config.meilisearch.host}/indexes/${uid}/settings`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.meilisearch.apiKey}`,
      },
      body: JSON.stringify(settings),
    }
  );
  if (!resp.ok) {
    const data = await resp.json();
    throw new Error(
      `Failed to apply settings to ${uid}: ${JSON.stringify(data)}`
    );
  }
  return await resp.json();
}

async function waitForTaskCompletion(task: { taskUid: number } | undefined) {
  if (!task?.taskUid) return;
  let status = "enqueued";
  while (status === "enqueued" || status === "processing") {
    await new Promise((r) => setTimeout(r, 1000));
    const resp = await fetch(
      `${config.meilisearch.host}/tasks/${task.taskUid}`,
      {
        headers: { Authorization: `Bearer ${config.meilisearch.apiKey}` },
      }
    );
    const data = await resp.json();
    status = data.status;
    if (status === "failed")
      throw new Error(`Meilisearch task failed: ${JSON.stringify(data.error)}`);
  }
}
