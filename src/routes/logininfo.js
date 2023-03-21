const express = require("express");

const router = express.Router();
const logininfoHandlers = require("../service/logininfo");

/**
 * @swagger
 * /logininfo:
 *   get:
 *     tags: [logininfo]
 *     summary: 사용자 정보 반환
 *     description: 로그인되어 있는 사용자의 정보를 반환
 *     responses:
 *       200:
 *         description: 사용자의 로그인 세션이 유효한 경우, 현재 로그인된 사용자의 정보를 반환, <br/>
 *           세션이 유효하지 않은 경우, 빈 오브젝트를 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: 사용자 id
 *                 sid:
 *                   type: string
 *                   description: 사용자 sid
 *                 name:
 *                   type: string
 *                   description: 사용자 이름
 */
router.route("/").get(logininfoHandlers.logininfoHandler);

/**
 * @swagger
 * /logininfo/detail:
 *   get:
 *     tags: [logininfo]
 *     summary: 상세한 사용자 정보 반환
 *     description: 로그인되어 있는 사용자의 <b>상세한</b> 정보를 반환
 *     responses:
 *       200:
 *         description: 사용자의 로그인 세션이 유효한 경우, 현재 로그인된 사용자의 정보를 반환, <br/>
 *           세션이 유효하지 않은 경우, 빈 오브젝트를 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 oid:
 *                   type: string
 *                 id:
 *                   type: string
 *                   description: 사용자 id
 *                 name:
 *                   type: string
 *                   description: 사용자 이름
 *                 nickname:
 *                   type: string
 *                 withdraw:
 *                   type: boolean
 *                 ban:
 *                   type: boolean
 *                 joinat:
 *                   type: string
 *                   format: date-time
 *                 agreeOnTermsOfService:
 *                   type: boolean
 *                 subinfio:
 *                   type: object
 *                   properties:
 *                     kaist:
 *                       type: string
 *                       description: KAIST 학번(8자리)
 *                       minLength: 8
 *                       maxLength: 8
 *                       example: 20190052
 *                     sparcs:
 *                       type: string
 *                     facebook:
 *                       type: string
 *                     twitter:
 *                       type: string
 *                 email:
 *                   type: string
 *                   example: geon6757@kaist.ac.kr
 *                 profileImgUrl:
 *                   type: string
 *                 account:
 *                   type: string
 */
router.route("/detail").get(logininfoHandlers.detailHandler);

module.exports = router;
