import { Router } from "express";
import authMiddleware from "./authMiddleware";

const router = Router()

router.use(authMiddleware);

export default router;