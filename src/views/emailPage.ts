import { getS3Url } from "@/modules/stores/aws";

const emailPage = (
  title: string,
  content: string
) => `<div style="font-family: system-ui; position: relative; background: #ffffff; margin: 0; padding: 72px;">
  <div style="width: max(min(100%, 800px), 320px); margin: 0 auto; padding 0;">
    <div style="height: 102px; background: #6E3678; margin: 0 0 48px; padding: 0;">
      <img style="height: 54px; margin: 24px 32px; padding: 0;" src="${getS3Url(
        "/assets/email-taxi-logo-white.svg"
      )}" alt="Taxi" />
    </div>
    ${
      title
        ? `<div style="font-family: system-ui; line-height: 160%; letter-spacing: 0px; font-size: 32px; font-weight: bold; color: #000000; margin: 0 0 32px; padding: 0;">${title}</div>`
        : ""
    }
    <div style="font-family: system-ui; line-height: 160%; letter-spacing: 0px; font-size: 16px; font-weight: regular; color: #000000; margin: 0; padding: 0;">${content}</div>
    <div style="border-top: 2px solid #999999; text-align: center; margin: 120px 0 0; padding: 24px 0 0;">
      <img style="height: 54px; margin: 0; padding: 0;" src="${getS3Url(
        "/assets/email-sparcs-logo-black.svg"
      )}" alt="SPARCS" />
      <a href="https://www.sparcs.org" target="_blank">
        <div style="margin: 0; padding: 0;">
          <u style="font-family: system-ui; font-size: 12px; font-weight: lighter; color: #999999;">www.sparcs.org</u>
        </div>
      </a>
      <div style="font-family: system-ui; font-size: 12px; font-weight: lighter; color: #999999; margin: 0; padding: 0;">taxi.sparcs@gmail.com</div>
    </div>
  </div>
</div>`;

export default emailPage;
