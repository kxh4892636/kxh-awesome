import { Hono } from "hono";
import { postsService } from "../services/posts";
import { createPostsRoutes } from "./posts";

export const apiRoutes = new Hono().route("/", createPostsRoutes({ postsService }));
