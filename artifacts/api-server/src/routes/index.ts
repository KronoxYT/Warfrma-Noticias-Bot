import { Router, type IRouter } from "express";
import healthRouter from "./health";
import warframeRouter from "./warframe";

const router: IRouter = Router();

router.use(healthRouter);
router.use(warframeRouter);

export default router;
