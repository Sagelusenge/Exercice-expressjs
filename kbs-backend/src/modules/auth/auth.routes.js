const router = require("express").Router();
const controller = require("./auth.controller");
const { validate } = require("../../middleware/validator.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const { enforceTenant } = require("../../middleware/tenant.middleware");
const {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendCodeSchema,
  changePasswordSchema,
} = require("./auth.validator");

router.post("/register", enforceTenant, validate(registerSchema), controller.register);
router.post("/login", enforceTenant, validate(loginSchema), controller.login);
router.post("/verify-email", enforceTenant, validate(verifyEmailSchema), controller.verifyEmail);
router.post("/verify-code", enforceTenant, validate(verifyEmailSchema), controller.verifyCode);
router.post("/resend-code", enforceTenant, validate(resendCodeSchema), controller.resendCode);
router.post("/forgot-password", enforceTenant, controller.forgotPassword);
router.post("/reset-password", enforceTenant, controller.resetPassword);
router.get("/me", authenticate, controller.getMe);
router.put("/change-password", authenticate, validate(changePasswordSchema), controller.changePassword);

module.exports = router;
