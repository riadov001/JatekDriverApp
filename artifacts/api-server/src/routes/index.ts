import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import driversRouter from "./drivers";
import ordersRouter from "./orders";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(driversRouter);
router.use(ordersRouter);

export default router;
