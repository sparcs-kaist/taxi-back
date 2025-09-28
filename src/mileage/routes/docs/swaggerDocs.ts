import { mileageSchema } from "./schemas/mileageSchema";
import mileageDocs from "./mileage";

export const mileageSwaggerDocs = {
  tags: [
    {
      name: "mileage",
      description: "마일리지 요약/내역/리더보드 관련 API",
    },
  ],
  paths: {
    ...mileageDocs,
  },
  components: {
    schemas: {
      ...mileageSchema,
    },
  },
};
