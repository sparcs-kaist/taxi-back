const tag = "emails";
const apiPrefix = "/emails";

const emailsDocs: Record<string, any> = {};

emailsDocs[`${apiPrefix}/openTracking`] = {
  get: {
    tags: [tag],
    summary: "이메일 오픈 트래킹",
    description: `이메일 오픈 여부를 추적하기 위한 트래킹 픽셀 엔드포인트입니다.<br/>
    이메일에 삽입된 1x1 투명 이미지가 로드될 때 호출되어 이메일 오픈 상태를 기록합니다.<br/>
    주로 신고 관련 이메일의 수신 확인을 위해 사용됩니다.`,
    parameters: [
      {
        in: "query",
        name: "trackingId",
        required: true,
        schema: {
          type: "string",
          format: "uuid",
        },
        description: "이메일 추적을 위한 고유 UUID",
        example: "123e4567-e89b-12d3-a456-426614174000",
      },
    ],
    responses: {
      200: {
        description: "트래킹 성공 - 1x1 투명 GIF 이미지 반환",
        content: {
          "image/gif": {
            schema: {
              type: "string",
              format: "binary",
              description: "1x1 투명 GIF 이미지 (트래킹 픽셀)",
            },
          },
        },
      },
      404: {
        description: "트래킹 ID를 찾을 수 없음",
        content: {
          "text/plain": {
            schema: {
              type: "string",
              example: "Emails/openTracking: Tracking ID not found",
            },
          },
        },
      },
      500: {
        description: "내부 서버 오류",
        content: {
          "text/plain": {
            schema: {
              type: "string",
              example: "Emails/openTracking: Internal Server Error",
            },
          },
        },
      },
    },
  },
};

export default emailsDocs;
