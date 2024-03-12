import { Router } from "express";
import { logoutUser, userLogin, userRegistration } from "../controllers/user.controllers";
import validate from "../middleware/validators.middleware";
import { validator } from "../utils/validators";
import { verifyJWT } from "../middleware/auth.middleware";

const router = Router()

router.route("/register").post( validate(validator), userRegistration)
router.route("/login").post(userLogin)
router.route("/logout").post( verifyJWT, logoutUser)

export default router