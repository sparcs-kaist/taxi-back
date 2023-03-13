const express = require("express");
const { body } = require("express-validator");
const validator = require("../middleware/validator");

const router = express.Router();
const reportHandlers = require("../service/reports");

// 라우터 접근 시 로그인 필요
router.use(require("../middleware/auth"));
/**
 * @swagger
 * /create:
 *   post:
 *     tags: [reports]
 *     summary: 신고 작성
 *     description: 주어진 유저를 전달된 사유로 신고함
 *     requestBody:
 *       description: Update an existent user in the store
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/createHandler'
 *     responses:
 *       200:
 *         description: report successful
 *         content:
 *           text/plain:
 *            schema:
 *              type: string
 *              example: report successful
 *       500:
 *         description: internal server error
 *         content:
 *           text/plain:
 *            schema:
 *              type: string
 *              example: internal server error
 * components:
 *   schemas:
 *     createHandler:
 *       type: object
 *       required:
 *         - reportedId
 *         - type
 *         - time
 *       properties:
 *         reportedId:
 *           type: string
 *           pattern: '^[a-fA-F\d]{24}$'
 *         type:
 *           type: string
 *           enum: ["no-settlement", "no-show", "etc-reason"]
 *         etcDetail:
 *           type: string
 *           maxLength: 30
 *         time:
 *           type: string
 *           format: date-time
 */
router.post(
  "/create",
  [
    body("reportedId").isMongoId(),
    body("type").isIn(["no-settlement", "no-show", "etc-reason"]),
    body("etcDetail").optional().isString().isLength({ max: 30 }),
    body("time").isISO8601(),
  ],
  validator,
  reportHandlers.createHandler
);

/**
 * @swagger
 * /searchByUser:
 *   get:
 *     tags: [reports]
 *     summary: 신고 내역 반환
 *     description: 로그인된 사용자의 신고한 내역과, 신고받은 내역을 반환한다 <br/>
 *                  1000개의 limit이 있다.
 *     responses:
 *       200:
 *         description: 신고된 내역과 신고 받은 내역
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reporting:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Report
 *                 reported:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Report
 *       500:
 *         description: "internal server error"
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "internal server error"
 */
router.get("/searchByUser", reportHandlers.searchByUserHandler);

module.exports = router;
