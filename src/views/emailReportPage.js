const { getS3Url } = require("../modules/stores/aws");

module.exports = (title, content) => `<style>
.email {
  font-family: system-ui;
  padding: 0;
  margin: 0;
}
.email-body {
  position: relative;
  padding: 72px;
}
.email-container {
  width: max(min(100%, 800px), 320px);
  margin: 0 auto;
}
.email-header {
  height: 204px;
  background: #6E3678;
  margin-bottom: 48px;
}
.email-header > img {
  height: 108px;
  margin: 48px;
}
.email-title {
  line-height: 160%;
  letter-spacing: -1.5px;
  font-size: 48px;
  font-weight: bold;
  margin-bottom: 48px;
}
.email-content {
  line-height: 160%;
  letter-spacing: -1.5px;
  font-size: 24px;
  font-weight: regular;
  color: #000000;
}
.email-footer {
  margin-top: 240px;
  padding-top: 24px;
  border-top: 2px solid #999999;
  text-align: center;
}
.email-footer > img {
  height: 86.4px;
}
.footer-text {
  margin-top: 8px;
  font-size: 20px;
  font-weight: lighter;
  text-decoration-line: underline;
  color: #999999;
}
</style>
<div class="email email-body">
  <div class="email email-container">
    <div class="email email-header">
      <img src="${getS3Url("/assets/email-taxi-logo-white.svg")}" alt="Taxi">
    </div>
    <div class="email email-title">${title}</div>
    <div class="email email-content">${content}</div>
    <div class="email email-footer">
      <img src="${getS3Url(
        "/assets/email-sparcs-logo-black.svg"
      )}" alt="SPARCS">
      <a href="https://www.sparcs.org" target="_blank"><div class="footer-text">www.sparcs.org</div></a>
      <div class="footer-text">sparcs.kaist@gmail.com</div>
    </div>
  </div>
</div>`;
