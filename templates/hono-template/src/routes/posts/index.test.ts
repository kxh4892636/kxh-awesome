import assert from "node:assert/strict";
import test from "node:test";
import { app } from "../../app";
import { initializeDatabase } from "../../db/setup";
import { getPostsResponseSchema } from "./schema";

void test("POST /api/posts/getPosts returns seeded posts", async () => {
  await initializeDatabase();

  const response = await app.request("/api/posts/getPosts", {
    method: "POST",
    headers: new Headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ random: false }),
  });

  const body = getPostsResponseSchema.parse(await response.json());

  assert.equal(response.status, 200);
  assert.equal(body.posts.length, 6);
  assert.equal(body.posts[0]?.id, 1);
});
